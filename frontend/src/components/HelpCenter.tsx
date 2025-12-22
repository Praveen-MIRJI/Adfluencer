import { useState } from 'react';
import { HelpCircle, X, MessageCircle, Book, ChevronDown, ChevronUp, Send } from 'lucide-react';
import Button from './ui/Button';

interface FAQ {
  question: string;
  answer: string;
}

const clientFAQs: FAQ[] = [
  {
    question: 'How do I post a new advertisement?',
    answer: 'Navigate to "Post Ad" from the sidebar, fill in the campaign details including title, description, budget range, platform, and deadline, then submit your advertisement.',
  },
  {
    question: 'How do I select an influencer for my campaign?',
    answer: 'Once influencers submit bids on your advertisement, you can review their proposals, shortlist candidates, and accept the best bid. A contract will be automatically created.',
  },
  {
    question: 'Can I message influencers before accepting their bid?',
    answer: 'Yes! You can message any influencer who has submitted a bid on your campaign through the Messages section.',
  },
  {
    question: 'How do I complete a contract?',
    answer: 'Go to the Contracts page, find the active contract, and click "Complete" once the influencer has delivered the content. You\'ll then be prompted to leave a review.',
  },
  {
    question: 'How do I discover new influencers?',
    answer: 'Use the "Discover Influencers" page to browse and filter influencers by niche, rating, and follower count.',
  },
];

const influencerFAQs: FAQ[] = [
  {
    question: 'How do I find campaigns to bid on?',
    answer: 'Go to "Browse Ads" to see all open campaigns. You can filter by platform, category, and budget range to find relevant opportunities.',
  },
  {
    question: 'How do I submit a bid?',
    answer: 'Click on any open advertisement, review the requirements, then fill in your proposed price, delivery time, and a compelling proposal explaining why you\'re the best fit.',
  },
  {
    question: 'What happens after my bid is accepted?',
    answer: 'A contract is automatically created. You\'ll receive a notification and can view the contract details in the Contracts section. Deliver the content by the deadline.',
  },
  {
    question: 'How do I build my portfolio?',
    answer: 'Go to the Portfolio page to add your best work. Include images, videos, or links to showcase your content creation skills to potential clients.',
  },
  {
    question: 'How do reviews work?',
    answer: 'After completing a contract, clients can leave reviews. Your average rating and review count are displayed on your profile to help attract more clients.',
  },
];

const clientRules = [
  'Provide clear and detailed campaign requirements',
  'Set realistic budgets and deadlines',
  'Respond to bids and messages promptly',
  'Complete contracts and leave honest reviews',
  'Respect influencer content and intellectual property',
  'Make payments through the platform only',
  'Report any issues or disputes immediately',
];

const influencerRules = [
  'Only bid on campaigns you can genuinely fulfill',
  'Provide accurate follower counts and engagement rates',
  'Deliver content by the agreed deadline',
  'Maintain professional communication with clients',
  'Disclose sponsored content as per platform guidelines',
  'Do not share client confidential information',
  'Keep your portfolio and profile up to date',
];

interface HelpCenterProps {
  userRole: 'CLIENT' | 'INFLUENCER';
}

export default function HelpCenter({ userRole }: HelpCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'rules' | 'chat'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Hello! I\'m your AI assistant. How can I help you today?' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const faqs = userRole === 'CLIENT' ? clientFAQs : influencerFAQs;
  const rules = userRole === 'CLIENT' ? clientRules : influencerRules;

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');

    // Placeholder response - Replace with RAG chatbot API call
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: 'Thank you for your question! This is a placeholder response. The RAG-based chatbot will be connected soon to provide intelligent answers based on our knowledge base.',
        },
      ]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-105 flex items-center justify-center z-40"
        title="Help Center"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden sm:mr-4 sm:mb-4">
            {/* Header */}
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Help Center</h2>
                <p className="text-primary-100 text-sm">
                  {userRole === 'CLIENT' ? 'Client Support' : 'Influencer Support'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-primary-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'faq'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Book className="w-4 h-4 inline mr-1" />
                FAQs
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'rules'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <HelpCircle className="w-4 h-4 inline mr-1" />
                Rules
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Chat
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* FAQs Tab */}
              {activeTab === 'faq' && (
                <div className="p-4 space-y-2">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 text-sm pr-2">
                          {faq.question}
                        </span>
                        {expandedFAQ === index ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rules Tab */}
              {activeTab === 'rules' && (
                <div className="p-4">
                  <div className="bg-primary-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-primary-900 mb-2">
                      Platform Guidelines
                    </h3>
                    <p className="text-sm text-primary-700">
                      Please follow these rules to maintain a professional and trustworthy marketplace.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            {activeTab === 'chat' && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  AI-powered support • Response times may vary
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
