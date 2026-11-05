import { useState } from 'react'
import { Activity, FileText, AlertCircle, Clock } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'queue' | 'audit'>('timeline')

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className="w-64 glass border-r">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">EHR Platform</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Medication Safety</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Review Queue</span>
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Audit Log</span>
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t glass">
          <div className="text-sm">
            <p className="font-medium">Demo Patient</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">John Doe (Synthetic)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'timeline' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Visit Timeline</h2>
              <div className="glass rounded-xl p-8 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No visits yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by adding a patient visit with medication records
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add New Visit
                </button>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Review Queue</h2>
              <div className="glass rounded-xl p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                <h3 className="text-xl font-semibold mb-2">3 Unresolved Conflicts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Medication discrepancies requiring professional review
                </p>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Audit Log</h2>
              <div className="glass rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No audit entries</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All actions will be logged here with timestamps
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
