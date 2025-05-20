import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord
} from "@fortawesome/free-brands-svg-icons";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";

export default function Component() {
  const [status, setStatus] = useState<{ status: string, activities: [{ name: string, details: string }] | [] } | undefined>(undefined)
  const f = async () => {
    setStatus(undefined)
    const _status = await (await fetch("https://discord.skota11.com/activity/896299292845817856/")).json()
    setStatus(_status)
  }
  useEffect(() => {
    f()
  }, [])
  const ActivityRender = () => {
    switch (status?.status) {
      case "online":
        if (status.activities.length == 0) {
          return (<><p><span className='text-green-600 mr-2'>●</span>ONLINE</p></>)
        } else {
          return <><p><span className='text-green-600 mr-2'>●</span>ONLINE</p><div className='border-l-4 p-2 my-2'><p className="text-base">{status.activities[0].name}をプレイ中</p><p className="text-sm">{status.activities[0].details}</p></div></>
        }
      case "idle":
        return <p><span className='text-orange-600 mr-2'>●</span>IDLE</p>
      case "dnd":
        return <p><span className='text-red-600 mr-2'>●</span>DoNotDisturb</p>
      case "offline":
        return <p><span className='text-black-600 mr-2'>●</span>OFFLINE</p>
      default:
        return <p>Loading...</p>
    }
  }
  return <>
    <ActivityRender />
    <hr className="my-2" />
    <p className="text-sm text-gray-900 flex gap-x-2 items-center"><FontAwesomeIcon className="text-lg" icon={faDiscord} /><span>Getting from Discord</span></p>
    <p className="text-right">
      <button className="" onClick={f}><FontAwesomeIcon icon={faRotateRight} /> </button>
    </p>
  </>
}
