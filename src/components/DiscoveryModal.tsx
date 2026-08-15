import React, { useState } from "react";
import { X, CheckCircle2, Send, MessageSquare } from "lucide-react";
import { useCms } from "../context/CmsContext";

interface ServiceItem {
  title: string;
  ghsPrice: string;
}

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTier: string;
  services: ServiceItem[];
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  isOpen,
  onClose,
  serviceTier,
  services,
}) => {
  const { addDiscoveryRequest, agencyInfo } = useCms();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    serviceTier: serviceTier || "Growth Retainer",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.businessName) return;

    addDiscoveryRequest({
      name: formData.name,
      email: formData.email,
      businessName: formData.businessName,
      serviceTier: formData.serviceTier,
      notes: formData.notes
    });

    setSubmitted(true);
  };

  const getWhatsappUrl = () => {
    const rawPhone = (agencyInfo.whatsapp || "+233235337886").replace(/[^0-9]/g, "");
    const message = `Hello NOK Social! I just booked a Discovery Call on your website.\n\n*Name:* ${formData.name}\n*Brand:* ${formData.businessName}\n*Email:* ${formData.email}\n*Service Tier:* ${formData.serviceTier}\n*Goals:* ${formData.notes || "N/A"}`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl neu-raised-lg p-6 sm:p-8 relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            onClose();
            setSubmitted(false);
          }}
          className="absolute top-6 right-6 p-2 rounded-xl neu-raised text-zinc-200 hover:text-[#F2F0EB] cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl neu-pressed text-[#B08D57] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#B08D57]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#F2F0EB]">Discovery Call Booked!</h3>
            <p className="text-xs text-zinc-200 max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="text-[#F2F0EB] font-semibold">{formData.name}</span>. Your request has been sent to our <span className="text-[#B08D57] font-semibold">NOK OS Inbound Queue</span>.
            </p>

            <div className="p-4 rounded-2xl neu-pressed bg-[#111115] border border-emerald-500/20 text-left space-y-2">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <span>✓ Instant WhatsApp Connect</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Want an immediate response? Connect directly with our lead strategist on WhatsApp right now:
              </p>
              <a
                href={getWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer mt-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => {
                onClose();
                setSubmitted(false);
              }}
              className="neu-gold-btn px-6 py-2.5 rounded-xl text-xs font-bold font-mono cursor-pointer mt-2"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="text-xs font-mono text-[#B08D57] uppercase tracking-wider font-semibold">NOK Social Agency</div>
              <h3 className="font-display text-xl font-bold text-[#F2F0EB]">Book a Discovery Call</h3>
              <p className="text-xs text-zinc-200 mt-1">
                Tell us about your brand and select your preferred service infrastructure.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ama Osei"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ama@brand.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Business or Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Osu Vintage Kicks"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Service Tier Preference</label>
                <select
                  value={formData.serviceTier}
                  onChange={(e) => setFormData({ ...formData, serviceTier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] bg-[#121216] outline-none focus:ring-1 focus:ring-[#B08D57]"
                >
                  {services.map((s, i) => (
                    <option key={i} value={s.title}>{s.title} ({s.ghsPrice})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Primary Goal / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your target channels or campaign goals..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Discovery Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DiscoveryModal;
