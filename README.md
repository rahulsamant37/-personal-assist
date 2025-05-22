# Personal Assist

Personal Assist is a Next.js project designed to provide a personal assistant experience. It integrates with Google Calendar, Gmail, and other services to help you manage your schedule, send emails, and set reminders.

## Features

- **Google Calendar Integration**: Schedule and manage your events directly from the app.
- **Gmail Integration**: Draft and send emails using your Gmail account.
- **Reminders**: Set and manage reminders for important tasks.
- **Chat Interface**: Interact with the assistant through a chat interface.

## Getting Started

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later) or yarn (v1.x or later)
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rahulsamant37/personal-assist.git
   cd personal-assist
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   Create a `.env.local` file in the root directory and add the following variables:

   ```env
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_url
   AUTH_SECRET=your_auth_secret
   ```

4. Run database migrations:

   ```bash
   npm run migrate
   ```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

Build the project for production:

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm start
# or
yarn start
```

## Deployment

### Deploying on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a Git repository.
2. Go to [Vercel](https://vercel.com) and create a new project.
3. Import your Git repository.
4. Set up environment variables in the Vercel dashboard.
5. Deploy your project.

For more details, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

We welcome contributions to the project! To contribute, follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes to your fork.
5. Create a pull request to the main repository.

## Reporting Issues

If you encounter any issues or have suggestions for improvements, please open an issue on the [GitHub repository](https://github.com/rahulsamant37/personal-assist/issues).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
