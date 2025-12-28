import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-800 rounded-xl">
                            <FileText className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms and Conditions</h1>
                            <p className="text-slate-400 text-sm mt-1">Last updated: December 28, 2024</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-8">

                    {/* Introduction */}
                    <section>
                        <p className="text-slate-300 leading-relaxed">
                            Welcome to Adfluencer! These Terms and Conditions govern your use of our platform. By accessing or using Adfluencer, you agree to be bound by these terms. Please read them carefully.
                        </p>
                    </section>

                    {/* For Clients */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">For Clients (Brands)</h2>
                        </div>
                        <div className="space-y-4 pl-11">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Campaign Posting</h3>
                                    <p className="text-slate-400 text-sm">You must provide accurate and complete information when posting campaigns. Misleading or false information is strictly prohibited.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Bid Acceptance</h3>
                                    <p className="text-slate-400 text-sm">Once you accept an influencer's bid, a binding contract is created. You are obligated to fulfill the agreed terms and make payment upon successful completion.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Payment Terms</h3>
                                    <p className="text-slate-400 text-sm">All payments must be made through the platform. Direct payments outside Adfluencer are prohibited and may result in account suspension.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Content Rights</h3>
                                    <p className="text-slate-400 text-sm">You must respect influencer intellectual property rights. Content usage rights should be clearly defined in your campaign requirements.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Professional Conduct</h3>
                                    <p className="text-slate-400 text-sm">Maintain professional communication with influencers. Harassment, discrimination, or abusive behavior will result in immediate account termination.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* For Influencers */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">For Influencers (Creators)</h2>
                        </div>
                        <div className="space-y-4 pl-11">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Accurate Information</h3>
                                    <p className="text-slate-400 text-sm">You must provide truthful information about your follower count, engagement rates, and audience demographics. False claims may result in account suspension.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Bid Commitment</h3>
                                    <p className="text-slate-400 text-sm">Only submit bids for campaigns you can genuinely fulfill. Once your bid is accepted, you are contractually obligated to deliver as promised.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Content Delivery</h3>
                                    <p className="text-slate-400 text-sm">Deliver content by the agreed deadline. Extensions must be requested and approved by the client before the deadline expires.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Disclosure Requirements</h3>
                                    <p className="text-slate-400 text-sm">You must disclose sponsored content according to platform guidelines (FTC, ASA, etc.) and local regulations. Failure to do so may result in legal consequences.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Quality Standards</h3>
                                    <p className="text-slate-400 text-sm">Maintain high-quality content standards. Content must meet the specifications outlined in the campaign requirements.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Platform Fees */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Platform Fees & Payments</h2>
                        </div>
                        <div className="space-y-3 pl-11">
                            <p className="text-slate-400 text-sm">Adfluencer charges a service fee on all transactions. Fees are clearly displayed before contract creation.</p>
                            <p className="text-slate-400 text-sm">Payments are processed securely through our payment gateway. Refunds are subject to our refund policy and dispute resolution process.</p>
                            <p className="text-slate-400 text-sm">All prices are displayed in INR (₹). Currency conversion fees may apply for international transactions.</p>
                        </div>
                    </section>

                    {/* Prohibited Activities */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Prohibited Activities</h2>
                        </div>
                        <div className="space-y-2 pl-11">
                            <p className="text-slate-400 text-sm flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>Attempting to circumvent platform fees by conducting transactions outside Adfluencer</span>
                            </p>
                            <p className="text-slate-400 text-sm flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>Sharing login credentials or allowing unauthorized access to your account</span>
                            </p>
                            <p className="text-slate-400 text-sm flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>Posting illegal, harmful, or offensive content</span>
                            </p>
                            <p className="text-slate-400 text-sm flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>Manipulating reviews, ratings, or engagement metrics</span>
                            </p>
                            <p className="text-slate-400 text-sm flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>Using automated tools or bots to interact with the platform</span>
                            </p>
                        </div>
                    </section>

                    {/* Dispute Resolution */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Shield className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Dispute Resolution</h2>
                        </div>
                        <div className="space-y-3 pl-11">
                            <p className="text-slate-400 text-sm">In case of disputes, both parties should attempt to resolve the issue through direct communication first.</p>
                            <p className="text-slate-400 text-sm">If resolution cannot be reached, you may escalate the dispute to Adfluencer support. Our team will review the case and make a fair decision based on the evidence provided.</p>
                            <p className="text-slate-400 text-sm">Adfluencer's decision in disputes is final and binding.</p>
                        </div>
                    </section>

                    {/* Account Termination */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Account Termination</h2>
                        <div className="space-y-3">
                            <p className="text-slate-400 text-sm">Adfluencer reserves the right to suspend or terminate accounts that violate these terms.</p>
                            <p className="text-slate-400 text-sm">You may close your account at any time, but you remain responsible for any outstanding contracts or payments.</p>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Limitation of Liability</h2>
                        <div className="space-y-3">
                            <p className="text-slate-400 text-sm">Adfluencer acts as a platform connecting clients and influencers. We are not responsible for the quality of work delivered or the conduct of users.</p>
                            <p className="text-slate-400 text-sm">We do not guarantee specific results from campaigns and are not liable for any indirect, incidental, or consequential damages.</p>
                        </div>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Changes to Terms</h2>
                        <p className="text-slate-400 text-sm">We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
                    </section>

                    {/* Contact */}
                    <section className="pt-6 border-t border-slate-800">
                        <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
                        <p className="text-slate-400 text-sm">If you have questions about these terms, please contact us at:</p>
                        <p className="text-rose-400 text-sm font-medium mt-2">support@adfluencer.com</p>
                    </section>

                </div>

                {/* Back to Login */}
                <div className="mt-8 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
