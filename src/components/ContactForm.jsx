"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Send, CheckCircle2, User, Phone, Mail, MessageSquare } from "lucide-react";

export default function ContactForm({
  title = "Send Us a Message",
  subtitle = "Our biomedical engineering specialists respond within 2 hours.",
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!form.name.trim()) {
      return toast.error("Please enter your full name.");
    }
    if (!form.phone.trim()) {
      return toast.error("Please enter your mobile number.");
    }
    if (!phoneRegex.test(form.phone.trim())) {
      return toast.error("Please enter a valid 10-digit mobile number.");
    }
    if (!form.email.trim()) {
      return toast.error("Please enter your email address.");
    }
    if (!emailRegex.test(form.email.trim())) {
      return toast.error("Please enter a valid email address.");
    }
    if (!form.message.trim()) {
      return toast.error("Please type your inquiry message.");
    }

    try {
      setSubmitting(true);

      await addDoc(
        collection(
          db,
          "websitesQueries",
          "clinidixcom",
          "contactQueries"
        ),
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          createdAt: new Date(),
        }
      );

      toast.success("Thank you! Your query has been submitted successfully.");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Error submitting query:", err);
      toast.error("Failed to submit message. Please try again or call directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E8D3BC] bg-white p-8 sm:p-10 shadow-xl shadow-[#C05800]/10">
      {title && (
        <h3 className="text-2xl font-bold text-[#38240D] sm:text-3xl">
          {title}
        </h3>
      )}

      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-[#5B4634]">
          {subtitle}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#38240D] mb-2">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Dr. Rajesh Kumar"
                className="w-full rounded-2xl border border-[#E8D3BC] bg-[#FFF9EF]/50 px-4 py-3.5 pl-11 text-sm text-[#38240D] transition-all focus:border-[#C05800] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C05800]/20"
                required
              />
              <User
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89078]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#38240D] mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full rounded-2xl border border-[#E8D3BC] bg-[#FFF9EF]/50 px-4 py-3.5 pl-11 text-sm text-[#38240D] transition-all focus:border-[#C05800] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C05800]/20"
                required
              />
              <Phone
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89078]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#38240D] mb-2">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@hospital.com"
              className="w-full rounded-2xl border border-[#E8D3BC] bg-[#FFF9EF]/50 px-4 py-3.5 pl-11 text-sm text-[#38240D] transition-all focus:border-[#C05800] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C05800]/20"
              required
            />
            <Mail
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89078]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#38240D] mb-2">
            Your Requirement / Message *
          </label>
          <div className="relative">
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your hospital/laboratory equipment requirements, required quantities, or service location..."
              className="w-full rounded-2xl border border-[#E8D3BC] bg-[#FFF9EF]/50 px-4 py-3.5 pl-11 text-sm text-[#38240D] transition-all focus:border-[#C05800] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C05800]/20"
              required
            />
            <MessageSquare
              size={18}
              className="pointer-events-none absolute left-3.5 top-4 text-[#A89078]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#C05800] py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#713600] hover:shadow-xl hover:shadow-[#C05800]/25 disabled:opacity-60"
        >
          {submitting ? (
            <span>Submitting Inquiry...</span>
          ) : (
            <>
              <span>Submit Official Inquiry</span>
              <Send size={18} />
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-2 text-xs text-[#5B4634] text-center pt-2">
          <CheckCircle2 size={14} className="text-[#C05800]" />
          <span>Your information is protected under strict privacy protocols.</span>
        </p>
      </form>
    </div>
  );
}
