import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, User, Clock, CheckCircle, XCircle, Plus, MapPin, Wifi, DollarSign, TrendingUp } from 'lucide-react';

export default function UncappedNetworkDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [newCallData, setNewCallData] = useState({
    phoneNumber: '',
    leadName: '',
    location: '',
    source: ''
  });
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_URL = 'http://localhost:3001';

  const SERVICE_AREAS = ['Utawala', 'Umoja', 'Mlolongo', 'Katani'];
  
  const PACKAGES = {
    mobile: { name: 'Mobile', price: 1499, speed: '6Mbps', color: 'blue' },
    entertainment: { name: 'Entertainment', price: 1999, speed: '12Mbps', color: 'purple' },
    business: { name: 'Business', price: 2499, speed: '20Mbps', color: 'green' }
  };

  useEffect(() => {
    fetchConversations();
    fetchStats();
    connectWebSocket();

    const interval = setInterval(fetchStats, 30000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCall]);

  const connectWebSocket = () => {
    wsRef.current = new WebSocket('ws://localhost:3001');

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'conversation_update') {
        setConversations(prev => {
          const index = prev.findIndex(c => c.callSid === data.callSid);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.data;
            return updated;
          }
          return [...prev, data.data];
        });

        if (selectedCall?.callSid === data.callSid) {
          setSelectedCall(data.data);
        }
        
        fetchStats();
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const initiateCall = async () => {
    try {
      const response = await fetch(`${API_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newCallData.phoneNumber,
          leadName: newCallData.leadName,
          leadInfo: {
            location: newCallData.location,
            source: newCallData.source
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsCallModalOpen(false);
        setNewCallData({ phoneNumber: '', leadName: '', location: '', source: '' });
        setTimeout(fetchConversations, 1000);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to initiate call');
    }
  };

  const updateQualification = async (callSid, qualified, notes) => {
    try {
      await fetch(`${API_URL}/api/conversations/${callSid}/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualified, notes })
      });
    } catch (error) {
      console.error('Error updating qualification:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      initiated: 'bg-blue-100 text-blue-800',
      ringing: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Uncapped Network</h1>
                <p className="text-sm text-red-100">Voice Agent Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <p className="font-medium">Contact: +254114561401</p>
                <p className="text-red-100">Utawala, Kokoto Crescent Road</p>
              </div>
              <button
                onClick={() => setIsCallModalOpen(true)}
                className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>New Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
                </div>
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualified Leads</p>
                  <p className="text-2xl font-bold text-green-600">{stats.qualifiedLeads}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Calls</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.activeCalls}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingReview}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
            </div>
            <div className="divide-y max-h-[calc(100vh-400px)] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No calls yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.callSid}
                    onClick={() => setSelectedCall(conv)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedCall?.callSid === conv.callSid ? 'bg-red-50 border-l-4 border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{conv.leadName}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(conv.status)}`}>
                        {conv.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{conv.phoneNumber}</p>
                    {conv.leadInfo?.location && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {conv.leadInfo.location}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(conv.startTime).toLocaleTimeString()}
                      </span>
                      {conv.qualified !== null && (
                        <span className="flex items-center">
                          {conv.qualified ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedCall ? (
              <div className="flex flex-col h-[calc(100vh-400px)]">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-red-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedCall.leadName}</h2>
                      <p className="text-sm text-gray-600">{selectedCall.phoneNumber}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCall.status)}`}>
                      {selectedCall.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedCall.leadInfo?.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Location</p>
                          <p className="font-medium text-gray-900">{selectedCall.leadInfo.location}</p>
                        </div>
                      </div>
                    )}
                    {selectedCall.leadInfo?.interestedPackage && (
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Interested Package</p>
                          <p className="font-medium text-gray-900">{selectedCall.leadInfo.interestedPackage}</p>
                        </div>
                      </div>
                    )}
                    {selectedCall.duration && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Duration</p>
                          <p className="font-medium text-gray-900">{Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s</p>
                        </div>
                      </div>
                    )}
                    {selectedCall.serviceableArea !== null && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${selectedCall.serviceableArea ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-gray-500 text-xs">Service Area</p>
                          <p className="font-medium text-gray-900">{selectedCall.serviceableArea ? 'Covered' : 'Not Covered'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {selectedCall.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm ${
                          msg.role === 'agent'
                            ? 'bg-white text-gray-900 border border-gray-200'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {msg.role === 'agent' ? '🤖 Agent (Sarah)' : '👤 Lead'}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className="text-xs mt-2 opacity-60">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Qualification Actions */}
                {selectedCall.status === 'completed' && (
                  <div className="p-4 border-t bg-white">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Qualification</h3>
                    <div className="flex space-x-3 mb-3">
                      <button
                        onClick={() => updateQualification(selectedCall.callSid, true, 'Qualified - Ready for installation')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                          selectedCall.qualified === true
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        ✓ Qualified
                      </button>
                      <button
                        onClick={() => updateQualification(selectedCall.callSid, false, 'Not qualified')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                          selectedCall.qualified === false
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        ✗ Not Qualified
                      </button>
                    </div>
                    {selectedCall.notes.length > 0 && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <p className="font-semibold mb-1">Notes:</p>
                        {selectedCall.notes.map((note, idx) => (
                          <p key={idx}>• {note.content}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-400px)] text-gray-500">
                <div className="text-center">
                  <Wifi className="w-16 h-16 mx-auto mb-4 text-red-300" />
                  <p className="text-lg font-medium">Select a call to view conversation</p>
                  <p className="text-sm text-gray-400 mt-2">Click on any call from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Wifi className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Initiate New Call</h2>
                <p className="text-sm text-gray-500">Reach out to potential customers</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newCallData.phoneNumber}
                  onChange={(e) => setNewCallData({ ...newCallData, phoneNumber: e.target.value })}
                  placeholder="+254712345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Name *
                </label>
                <input
                  type="text"
                  value={newCallData.leadName}
                  onChange={(e) => setNewCallData({ ...newCallData, leadName: e.target.value })}
                  placeholder="John Mwangi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={newCallData.location}
                  onChange={(e) => setNewCallData({ ...newCallData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {SERVICE_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  type="text"
                  value={newCallData.source}
                  onChange={(e) => setNewCallData({ ...newCallData, source: e.target.value })}
                  placeholder="Website, Referral, Social Media, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsCallModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={initiateCall}
                disabled={!newCallData.phoneNumber || !newCallData.leadName}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Start Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}