"use client"

const TempPOSTestPage = ({ user }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-600 mb-2">✅ Success!</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Temporary POS Router Active</h2>
        </div>
        
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">User Information:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Username:</span>
              <span className="text-gray-900">{user?.username || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">User Type:</span>
              <span className="font-bold text-green-600">{user?.user_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Branch:</span>
              <span className="text-gray-900">{user?.branch || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Routing Status:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>TempPOSRouter is loaded correctly</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>User type "temp_pos" detected</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>No access to other routes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span>Temporary POS page ready to use</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>This is a test page to verify routing is working correctly.</p>
          <p className="mt-2">The actual Temporary POS page will load here.</p>
        </div>
      </div>
    </div>
  )
}

export default TempPOSTestPage
