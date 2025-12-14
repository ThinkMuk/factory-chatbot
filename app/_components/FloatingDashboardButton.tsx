'use client';
import React from 'react';

export default function FloatingDashboardButton() {
  return (
    <button
      onClick={() => {
        window.open(
          'https://dashboard-inha2025-ews.education.wise-paas.com/d/Qyv7AvGDz/sankey?orgId=5&from=1742396400000&to=1745419800000',
          '_blank',
          'noopener,noreferrer'
        );
      }}
      className='w-full h-[68px] bg-[#FAFBFD] border-t cursor-pointer rounded-t-4xl border-black/10 hover:bg-[#e8f0fa] transition-colors duration-200'
    >
      <div className='text-[18px] font-bold'>
        <span className='text-[#17437C]'>WISE-PaaS /</span>
        <span className='text-[#288DD7]'> Dashboard</span>
      </div>
    </button>
  );
}
