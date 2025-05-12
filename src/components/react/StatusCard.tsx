import { useEffect, useState } from "react"

export default function Component() {
  const [status , setStatus] = useState<{status : string , activities? : [{name : string , details : string}]}>()
  useEffect(() => {
    const f = async () => {
      const _status = await (await fetch("https://my-activity-discord.onrender.com/activity/896299292845817856/")).json()
      setStatus(_status)
    }
    f()
  } , [])
  const ActivityRender = () => {
    switch (status?.status) {
      case "online":
        if (!status.activities) {
          return (<><p><span className='text-green-600 mr-2'>●</span>ONLINE</p></>)
        } else {
          return <><p><span className='text-green-600 mr-2'>●</span>ONLINE</p><div className='border-l-4 p-2 my-4'><p>{status.activities[0].name}をプレイ中</p><p>{status.activities[0].details}</p></div></>
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
  </>
}