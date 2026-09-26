import React from 'react'
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { FiTruck, FiShield, FiClock } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className='border-t border-surface-border bg-white text-surface-muted mt-auto'>
      {/* Quick-commerce Trust Badges */}
      <div className='border-b border-surface-border/60 bg-surface-50/50 py-6 px-4'>
        <div className='container mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl'>
          <div className='flex items-center justify-center sm:justify-start gap-3 text-center sm:text-left'>
            <div className='w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0'>
              <FiClock size={20} />
            </div>
            <div>
              <p className='font-semibold text-xs sm:text-sm text-surface-title'>10-Minute Delivery</p>
              <p className='text-xs text-surface-muted'>Lightning fast at your doorstep</p>
            </div>
          </div>
          
          <div className='flex items-center justify-center sm:justify-start gap-3 text-center sm:text-left'>
            <div className='w-10 h-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center shrink-0'>
              <FiShield size={20} />
            </div>
            <div>
              <p className='font-semibold text-xs sm:text-sm text-surface-title'>Best Quality Assurance</p>
              <p className='text-xs text-surface-muted'>Direct from verified local hubs</p>
            </div>
          </div>

          <div className='flex items-center justify-center sm:justify-start gap-3 text-center sm:text-left'>
            <div className='w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0'>
              <FiTruck size={20} />
            </div>
            <div>
              <p className='font-semibold text-xs sm:text-sm text-surface-title'>Free Delivery on Offers</p>
              <p className='text-xs text-surface-muted'>Exclusive deals every single day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Bottom Bar */}
      <div className='container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm'>
        <div className='flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-surface-muted'>
          <span className='font-bold text-brand-700 tracking-tight text-sm'>GrabItGo</span>
          <span className='hidden sm:inline'>•</span>
          <p>© {new Date().getFullYear()} GrabItGo Technologies Pvt. Ltd. All rights reserved.</p>
        </div>

        <div className='flex items-center gap-3 text-lg text-surface-muted'>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors'
          >
            <FaFacebook size={16} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors'
          >
            <FaInstagram size={16} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors'
          >
            <FaTwitter size={16} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors'
          >
            <FaLinkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
