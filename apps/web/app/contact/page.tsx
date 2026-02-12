import ContactForm from "../components/ContactForm";
import Container from "../components/Container";
import EmailSignupSection from "@/app/components/EmailSignupSection";
import Image from "next/image";

export const metadata = {
    title: "Contact Matt | Fairfield County Real Estate",
    description: "Get in touch with Matt for expert guidance on buying, selling, or investing in Fairfield County real estate.",
};

export default function ContactPage() {
    return (
        <div className="bg-stone-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-stone-900 text-white overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{ backgroundImage: "url('/visual/stock/greenwich-harbor.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-stone-900/20" />
                <Container className="relative z-10 py-16 md:py-20">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                            Contact Matt
                        </h1>
                        <p className="text-lg text-stone-300 leading-relaxed">
                            Have questions about buying, selling, or the local market? Let's connect.
                        </p>
                    </div>
                </Container>
            </section>

            <Container className="py-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
                            <h2 className="text-2xl font-serif font-medium text-stone-900 mb-6">
                                Send a Message
                            </h2>
                            <ContactForm />
                        </div>
                    </div>

                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Direct Contact Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6">
                            <h3 className="text-lg font-serif font-medium text-stone-900 mb-4">
                                Prefer to Reach Out Directly?
                            </h3>
                            <div className="space-y-4">
                                <a
                                    href="tel:+19143256746"
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                                        <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-stone-500">Phone</p>
                                        <p className="font-medium text-stone-900">(914) 325-6746</p>
                                    </div>
                                </a>
                                <a
                                    href="mailto:mattcaiola@higginsgp.com"
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                                        <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-stone-500">Email</p>
                                        <p className="font-medium text-stone-900">mattcaiola@higginsgp.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Office Info Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6">
                            <h3 className="text-lg font-serif font-medium text-stone-900 mb-4">
                                Office Location
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-stone-900">Higgins Group Private Brokerage</p>
                                    <p className="text-stone-600 text-sm mt-1">
                                        1055 Washington Blvd<br />
                                        Stamford, CT 06901
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Availability Card */}
                        <div className="bg-stone-900 text-white rounded-2xl p-6">
                            <h3 className="text-lg font-serif font-medium mb-3">
                                Availability
                            </h3>
                            <p className="text-stone-300 text-sm leading-relaxed">
                                Available 7 days a week for client calls and property tours.
                                Evening and weekend appointments welcome.
                            </p>
                            <div className="mt-4 pt-4 border-t border-stone-700">
                                <p className="text-xs text-stone-400">
                                    Typical response time: within 2 hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
            <EmailSignupSection />
        </div>
    );
}
