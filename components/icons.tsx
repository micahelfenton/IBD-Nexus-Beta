import React from 'react';

// FIX: Populating the icons file with SVG icon components as required by other components.
// Common props for all icons
interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const MicrophoneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6zM12 12.75V15m0 3.75V21m-3.75-9.75h7.5" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

export const SymptomIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export const MoodIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.75h.008v.008H9V9.75zm6 0h.008v.008H15V9.75z" />
  </svg>
);

export const FoodIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 15.25l-.813.654-.813-.655L6.563 16.5l.813.654L6.562 17.81l.813.654.813-.654.813.654L9 16.5l.813.654L9.813 15.904z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 10.5c.621 0 1.125.504 1.125 1.125v2.625c0 .621-.504 1.125-1.125-1.125H2.25c-.621 0-1.125-.504-1.125-1.125v-2.625c0-.621.504-1.125 1.125-1.125h19.5z" />
    </svg>
);

export const ExerciseIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.842A48.22 48.22 0 005.25 3.75.75.75 0 004.5 4.5v15a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75V11.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.842V11.25m0-7.408a23.94 23.94 0 015.658 0m-5.658 0l-1.428.06a.75.75 0 01-.714-.714V3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 11.25c0-1.036-.84-1.875-1.875-1.875h-1.5a1.875 1.875 0 110-3.75h1.5A1.875 1.875 0 0118.75 7.5v3.75z" />
    </svg>
);

export const DashboardIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

export const JournalIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const BodyAnatomyIcon: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        {/* The outer body shape, semi-transparent to mimic an X-ray view */}
        <g opacity="0.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3C7.5 4 6 6.5 5 10C4 16 6 22 12 22C18 22 20 16 19 10C18 6.5 16.5 4 15 3" />
            <path d="M9 3C9.5 2.5 10.5 2 12 2C13.5 2 14.5 2.5 15 3" />
            <path d="M8 7H16" /> {/* Clavicle line */}
        </g>
        
        {/* The digestive organs, fully opaque to make them stand out */}
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Esophagus */}
            <path d="M12 4V9" />
            
            {/* Liver and Stomach */}
            <path d="M12 9C9.5 9 8 10 8.5 12C9 14 11 14.5 12 14.5" />
            <path d="M12 9C14.5 9 16 10 15.5 12C15 14 13 14.5 12 14.5" />
            
            {/* Intestines */}
            <path d="M8.5 15C8.5 15 8 20 12 20C16 20 15.5 15 15.5 15" /> {/* Large Intestine */}
            
            <path d="M10.5 15.5C11.5 16 12.5 16 13.5 15.5" /> {/* Small Intestine Coils */}
            <path d="M10.5 17C11.5 17.5 12.5 17.5 13.5 17" />
            <path d="M10.5 18.5C11.5 19 12.5 19 13.5 18.5" />
        </g>
    </svg>
);

export const CrystalBallIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5c-3.5 0-6.5 2-7.5 5.25c1 3.25 4 5.25 7.5 5.25s6.5-2 7.5-5.25c-1-3.25-4-5.25-7.5-5.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.284 9.75c-.328.984-.534 2.036-.534 3.125c0 4.142 3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5c0-1.09-.206-2.14-.535-3.125" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25h6" />
    </svg>
);

export const ResearchIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.953 14.953 0 00-12.433-12.433m12.433 12.433L18.13 4.977a14.953 14.953 0 00-12.433 12.433" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
    </svg>
);

export const PaperClipIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
  </svg>
);

export const PhotoIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const FireIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797zM12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
);
  
export const DropletIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-4.142 0-7.5-3.358-7.5-7.5 0-4.142 7.5-12.75 7.5-12.75s7.5 8.608 7.5 12.75c0 4.142-3.358 7.5-7.5 7.5z" />
    </svg>
);

export const DietIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0 1.258-1.017 2.275-2.275 2.275H5.275C4.017 10.5 3 9.508 3 8.25v-1.5C3 5.492 4.017 4.5 5.275 4.5h13.45C19.983 4.5 21 5.492 21 6.75v1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6.75m0 0c-3.14 0-5.25-1.12-5.25-3V12m5.25 1.5c3.14 0 5.25-1.12 5.25-3V12" />
    </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

export const ChatBubbleBottomCenterTextIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.425v-2.287a6.75 6.75 0 016.75-6.75h.75c4.97 0 9 3.694 9 8.25z" />
    </svg>
  );
  
export const ArrowUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
  </svg>
);

export const SpeakingHeadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
        {/* Microphone */}
        <rect x="10" y="3" width="4" height="8" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5M10 16h4" />
        {/* Left waves */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 6v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7v2" opacity="0.6" />
        {/* Right waves */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 6v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7v2" opacity="0.6" />
    </svg>
);

export const DotsVerticalIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);

export const MenuScannerIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5v15H3.75v-15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h4.5M9.75 14.25h4.5M3.75 9.75h1.5M3.75 14.25h1.5M18.75 9.75h-1.5M18.75 14.25h-1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4.5a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM2.25 12h19.5" />
    </svg>
);
