
export function SideBar({setActiveLayout,ActiveLayout="Bookings"}) {
  console.log("ActiveLayout in sidebar:",ActiveLayout);
  return (<>
    
    <aside className="w-64 flex-shrink-0 bg-surface-dark flex flex-col p-4 border-r border-border-dark">
        <div className="flex items-center gap-2 px-4 py-2 mb-8">
          <span className="material-icons-outlined text-primary text-3xl">sports_soccer</span>
          <span className="text-2xl font-bold text-text-primary-dark">TurfAdmin</span>
        </div>
        <nav className="flex-grow">
          <ul>
            <li onClick={()=>{setActiveLayout("Dashboard")
              alert("")}
            } className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary text-white font-semibold" href="#">
                <span className="material-icons-outlined">dashboard</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li onClick={setActiveLayout("Bookings")} className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary-dark hover:bg-gray-700" href="#">
                <span className="material-icons-outlined">book_online</span>
                <span>Bookings</span>
              </a>
            </li>
            <li onClick={setActiveLayout("Schedule")} className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary-dark hover:bg-gray-700" href="#">
                <span className="material-icons-outlined">event</span>
                <span>Schedule</span>
              </a>
            </li>
            <li onClick={setActiveLayout("Payments")} className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary-dark hover:bg-gray-700" href="#">
                <span className="material-icons-outlined">payment</span>
                <span>Payments</span>
              </a>
            </li>
            <li onClick={setActiveLayout("Customers")} className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary-dark hover:bg-gray-700" href="#">
                <span className="material-icons-outlined">people</span>
                <span>Customers</span>
              </a>
            </li>
            <li onClick={setActiveLayout("Settings")}  className="mb-2">
              <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary-dark hover:bg-gray-700" href="#">
                <span className="material-icons-outlined">settings</span>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
            <div className="flex items-center gap-3">
              <img 
                alt="Admin user avatar" 
                className="w-10 h-10 rounded-full object-cover" 
                src="https://ui-avatars.com/api/?name=Admin+User&background=random" 
              />
              <div>
                <p className="font-semibold text-sm text-text-primary-dark">Admin User</p>
                <p className="text-xs text-text-secondary-dark">admin@turf.co</p>
              </div>
            </div>
            <span className="material-icons-outlined text-text-secondary-dark">logout</span>
          </div>
        </div>
      </aside>
  </>)
}
