<div align="center">
  <img src="https://raw.githubusercontent.com/Kaa278/kotoflash/main/public/logo.png" alt="Kotoflash Logo" width="120" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3898/3898150.png'"/>
  
  # 🇯🇵 Kotoflash
  **Sleek, Zen-inspired Japanese Vocabulary Flashcards**
  
  *Master the language with style, precision, and AI assistance.*

  [Demo](https://kotoflash.vercel.app) • [Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation)
</div>

---

## ✨ Overview
**Kotoflash** is a premium, web-based flashcard platform designed specifically for Japanese language learners. Built with a focus on **minimalist design** and **fluid user experience**, it provides a distraction-free environment to build and master your personal dictionary.

---

## 🚀 Features

### 🧠 AI-Powered Vocabulary Generation
Never run out of study material. Use our integrated AI to generate thematic vocabulary lists based on any topic (e.g., "Food", "Business", "Travel").

### 📱 Premium Mobile Experience
- **Modal Gestures**: Native-feeling drag-to-dismiss gestures with rubber-band effects.
- **Responsive Grid**: Optimized 2-column layout for mobile browsing.
- **Glassmorphic UI**: Beautiful, translucent interface elements for a modern feel.

### 🔄 Intuitive Review Session
- **Progress Tracking**: Real-time progress bar with session completion screens.
- **Interactive Cards**: Flip and navigate through your collection with smooth animations.
- **Quick Edit**: Modify or correct words directly from your vocabulary list.

### 💾 Data Management
- **Local Persistence**: All your data is saved securely in your browser's local storage.
- **JSON Backup**: Export and import your entire collection for safe-keeping.

---

## 🛠 Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)
- **AI Engine**: Llama 3.1 via Custom API Gateway

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kaa278/kotoflash.git
   cd kotoflash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   LLM_API_KEY=your_api_key_here
   LLM_MODEL=llama3.1-8b-instruct
   LLM_BASE_URL=https://ai.gateway.syi.fan/v1
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

<div align="center">
  Made with ❤️ by <b>Admin Cipan (Kaa)</b>
</div>
