import React, { useState } from 'react'
import {SideBar} from './sidebar/SideBar.jsx'
import {BookingsLayout} from './layouts/BookingsLayout.jsx'
const Dashboard = () => {
    const [ActiveLayout,setActiveLayout]=useState("Bookings")
  return (
    <>
    <SideBar ActiveLayout={ActiveLayout} setActiveLayout={setActiveLayout}/>
    {ActiveLayout=="Bookings"&&<BookingsLayout/>}
    </>
  )
}
export default Dashboard


