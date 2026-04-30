"use client";

import { useState } from "react";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { name: "Profile", href: "/profile" },
    { name: "Bookings", href: "/bookings" },
    { name: "Cart", href: "/cart" },
    { name: "Favorites", href: "/favorites" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E17]">
      <header className="pt-5 px-5 flex justify-between items-center">
        <button
          onClick={toggleMenu}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle menu">
          <img
            src="/components/icons/hamburger-menu.png"
            alt="Menu"
            width={24}
            height={24}
            className="object-contain"
          />
        </button>
        <div className="flex-1 flex justify-center">
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            width={120}
            height={50}
            className="object-contain"
          />
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {isMenuOpen && (
        <div className="absolute top-16 left-5 bg-gray-800 rounded-lg shadow-lg z-50 min-w-[150px]">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="block px-4 py-3 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}>
              {item.name}
            </a>
          ))}
        </div>
      )}

      <main className="flex-1 flex flex-col justify-center items-center p-5"></main>
    </div>
  );
}
