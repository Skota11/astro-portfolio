import { useEffect, useState, useCallback, useRef, type ReactElement } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord
} from "@fortawesome/free-brands-svg-icons";
import { faMobileScreenButton, faDesktop, faGlobe, faMusic } from "@fortawesome/free-solid-svg-icons";
import type { LanyardData, DiscordStatus } from "../../types";

export default function Component() {
  const [status, setStatus] = useState<LanyardData | null>(null)
  const [connecting, setConnecting] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<number | null>(null)
  const manualClose = useRef(false)

  const USER_ID = "896299292845817856"; // ここは props 化可能
  const GATEWAY_URL = "wss://api.lanyard.rest/socket";

  type LanyardWSHello = { op: 1; d: { heartbeat_interval: number } }
  type LanyardWSInit = { op: 0; t: "INIT_STATE"; d: LanyardData }
  type LanyardWSUpdate = { op: 0; t: "PRESENCE_UPDATE"; d: LanyardData }
  type LanyardWSPayload = LanyardWSHello | LanyardWSInit | LanyardWSUpdate | { op: number; [k: string]: any }

  const connect = useCallback(() => {
    manualClose.current = false
    setConnecting(true)
    const ws = new WebSocket(GATEWAY_URL)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
    }

    ws.onmessage = (ev) => {
      try {
        const payload: LanyardWSPayload = JSON.parse(ev.data)
        switch (payload.op) {
          case 1: { // HELLO
            const interval = (payload as LanyardWSHello).d.heartbeat_interval
            if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
            heartbeatRef.current = window.setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 })) // HEARTBEAT
              }
            }, interval)
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }))
            break
          }
          case 0: {
            const t = (payload as any).t
            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
              const data = (payload as LanyardWSInit | LanyardWSUpdate).d
              setStatus(data)
              setConnecting(false)
            }
            break
          }
          default:
            break
        }
      } catch (e) {
        console.error('WS message parse error', e)
      }
    }

    ws.onerror = (e) => {
      console.error('WS error', e)
    }

    ws.onclose = () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      if (manualClose.current) return
      const attempt = reconnectAttempts.current + 1
      reconnectAttempts.current = attempt
      const delay = Math.min(1000 * Math.pow(2, attempt), 30_000)
      setConnecting(true)
      reconnectTimer.current = window.setTimeout(connect, delay)
    }
  }, [])

  const disconnect = useCallback(() => {
    manualClose.current = true
    if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current)
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  const ActivityRender = () => {
  if (connecting && !status) return <p className='animate-pulse text-gray-500'>接続中...</p>
    if (!status) return <p className='text-red-600 text-sm'>Error</p>

    const discordStatus: DiscordStatus | undefined = status?.discord_status
    const colorMap: Record<DiscordStatus, string> = {
      online: 'text-green-600',
      idle: 'text-orange-600',
      dnd: 'text-red-600',
      offline: 'text-gray-500'
    }

    if (!discordStatus) return <p className='text-gray-500'>No data</p>

    const dot = <span className={colorMap[discordStatus] + ' mr-2'}>●</span>

    const baseStatus = () => {
      switch (discordStatus) {
        case 'online':
          return 'ONLINE'
        case 'idle':
          return 'IDLE'
        case 'dnd':
          return 'DoNotDisturb'
        case 'offline':
          return 'OFFLINE'
      }
    }

    const activityTypeLabel = (t: number, name: string) => {
      // Discord official types reference (subset): 0 Game, 1 Streaming, 2 Listening, 3 Watching, 4 Custom, 5 Competing
      switch (t) {
        case 0: return `${name} をプレイ中`;
        case 1: return `${name} を配信中`;
        case 2: return `${name} を聴取中`;
        case 3: return `${name} を視聴中`;
        case 4: return `${name}`; // Custom Status -> just show name (usually 'Custom Status') and state line separately
        case 5: return `${name} に参加中`;
        default: return name;
      }
    }

    const spotify = status?.spotify;
    // Filter activities to avoid duplicating Spotify listening state
    let activities = status?.activities ?? [];
    if (spotify) {
      activities = activities.filter(a => {
        // type=2 (Listening) を除外 (Spotify カードで表示するため)
        if (a.type === 2) return false;
        // name が 'Spotify' の場合も除外（安全策）
        if (a.name.toLowerCase() === 'spotify') return false;
        return true;
      });
    }
    const showActivities = activities.length > 0;

    return <div className='space-y-3'>
      <div className='flex items-center flex-wrap gap-x-2 gap-y-1'>
        <p className='flex items-center'>{dot}{baseStatus()}</p>
        <DeviceIcons data={status!} />
      </div>
      {spotify && (
        <div className='border rounded p-2 text-xs bg-green-50 flex items-start gap-2'>
          <FontAwesomeIcon icon={faMusic} className='text-green-600 mt-0.5' />
          <div className='space-y-0.5'>
            <p className='text-green-700'>Spotifyを再生中</p>
            <p className=''>{spotify.song}</p>
            <p className='font-small text-gray-600'>{spotify.artist}</p>
          </div>
        </div>
      )}
      {showActivities && (
        <ul className='mt-1 space-y-2'>
          {activities.slice(0, 4).map((act, idx) => {
            const label = activityTypeLabel(act.type, act.name)
            return (
              <li key={idx} className='border-l-4 pl-3 py-1 text-sm'>
                <p className='font-medium'>{label}</p>
                {act.details && <p className='text-xs text-gray-600'>{act.details}</p>}
                {act.state && <p className='text-xs text-gray-500'>{act.state}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  }

  // Device icons component (inline for now)
  const DeviceIcons = ({ data }: { data: LanyardData }) => {
    const icons: ReactElement[] = []
    if (data.active_on_discord_mobile) icons.push(<FontAwesomeIcon key='m' icon={faMobileScreenButton} title='Mobile' className='ml-2' />)
    if (data.active_on_discord_desktop) icons.push(<FontAwesomeIcon key='d' icon={faDesktop} title='Desktop' className='ml-2' />)
    if (data.active_on_discord_web) icons.push(<FontAwesomeIcon key='w' icon={faGlobe} title='Web' className='ml-2' />)
    return <div className='flex gap-1'>{icons}</div>
  }
  return <>
    <ActivityRender />
    <hr className="my-2" />
    <div className="text-sm text-gray-900 flex flex-col gap-y-1">
      <p className="flex gap-x-2 items-center"><FontAwesomeIcon className="text-lg" icon={faDiscord} /><span>Getting from Discord</span></p>
    </div>
    <p className="text-right">
      <button
        className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded border disabled:opacity-40"
        onClick={() => { disconnect(); connect(); }}
        title="Reconnect WebSocket"
        aria-label="Reconnect WebSocket"
        disabled={connecting}
      >
        {connecting ? '接続中' : 'リアルタイムで更新中'}
      </button>
    </p>
  </>
}
