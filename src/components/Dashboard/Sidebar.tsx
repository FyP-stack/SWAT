export default function Sidebar() {
  return (
    <div className="w-64 bg-[#0d1220] h-full p-6">
      <h1 className="text-xl font-bold mb-6">SWaT UI</h1>

      <ul className="space-y-4 text-gray-300">
        <li className="hover:text-white cursor-pointer">Dashboard</li>
        <li className="hover:text-white cursor-pointer">Evaluation</li>
        <li className="hover:text-white cursor-pointer">Reports</li>
      </ul>
    </div>
  );
}
