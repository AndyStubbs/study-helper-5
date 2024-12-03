
# Study Helper Application

The Study Helper web application is designed to assist users in creating, studying, and managing topics effectively. It incorporates dynamic quiz generation using AI, document uploads for content-based question generation, and progress tracking.

## Features

### Backend
- **Django Framework**: Provides user authentication, session management, and secure storage for uploaded files.
- **File Uploads**: User-uploaded files are stored as content chunks that can be used to assist the AI in generating quesitons.
- **AJAX Endpoints**: Enable dynamic interactions between the frontend and backend, protected with CSRF tokens.

### Frontend
- **Dynamic UI**: Built with vanilla JavaScript for real-time updates and modals for quizzes, explanations, history, and document uploads.
- **Code Editor**: Includes a custom code editor with syntax highlighting powered by `highlight.js`.
- **Responsive Design**: Minimalistic, mobile-friendly interface with both light and dark themes.

### Core Features
- **Quiz Generation**: Multiple-choice, true/false, and open-ended questions.
- **Document Upload**: Users can upload text, json, and PDF files to generate questions from uploaded content.
- **Explanations**: Detailed AI-powered explanations for quiz questions.
- **Progress Tracking**: History tab for tracking correct and incorrect answers.

## Installation

### Prerequisites
- Python 3.8+
- Node.js (optional, for frontend dependencies)
- SQLite (default database for development)
- OpenAI token

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/study-helper.git
   cd study-helper
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your database settings in `settings.py` (optional for SQLite users).
4. Apply migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```
6. Access the application at `http://127.0.0.1:8000`.

## Usage

- Log in or create an account.
- Navigate to the "Topic Generator" tab to create a new topic.
- Use the "Upload Documents" feature to add files for generating topic-specific questions.
- Study topics and track progress in the "History" tab.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
