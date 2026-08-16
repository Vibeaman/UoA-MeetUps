# UoA MeetUps

UoA MeetUps is a campus dating and social platform for University of Abuja students. The application includes profile discovery, swipe matching, Lowkey Mode, photo verification flows, real-time chat interfaces, campus stories, polls, gossip discussions, safety tools, and an administrator dashboard.

## Technology

The frontend is a Vite-powered React and TypeScript application styled with Tailwind CSS. Supabase is supported for the application data layer, while the current demo experience includes local browser persistence and seeded sample data.

## Local development

### Prerequisites

Install Node.js 18 or newer and npm.

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy the example environment file and provide the Supabase project values when a connected Supabase environment is required:

```bash
cp .env.example .env.local
```

The supported variables are:

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Optional | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase public anonymous key. |

The application contains a fallback demo configuration, so the interface can still be previewed without local environment variables. Do not expose Supabase service-role credentials in a client-side deployment.

### Run the development server

```bash
npm run dev
```

The development server is available at `http://localhost:3000`.

### Validate and build

```bash
npm run lint
npm run build
npm run preview
```

The production build is emitted to `dist/`.

## Deploy to Vercel

This repository includes a `vercel.json` configuration for the Vite single-page application. Vercel can deploy it directly from the GitHub repository.

1. In Vercel, create a new project and import `Vibeaman/UoA-MeetUps`.
2. Use the detected Vite framework preset, or set the build command to `npm run build` and the output directory to `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the project’s Environment Variables when using Supabase.
4. Deploy the project. Subsequent pushes to the selected branch will create new deployments automatically.

The Vercel rewrite sends application routes to `index.html`, allowing the React client-side application to load correctly after a direct visit or browser refresh.

## Project structure

- `src/components/` contains the application views, modals, and reusable interface components.
- `src/context/` contains the shared application state and local persistence logic.
- `src/lib/` contains external service clients.
- `src/data/` contains seeded demo data.
- `supabase_schema.sql` contains the database schema for a Supabase-backed deployment.

## License

No license has been specified for this repository.

## Contributing

Create a feature branch, make the smallest focused change possible, run `npm run lint` and `npm run build`, then open a pull request with a clear description of the behavior that changed.

---

Built for the University of Abuja student community.

## References

[1]: https://vercel.com/docs/frameworks/frontend/vite "Vercel Vite documentation"
[2]: https://vite.dev/guide/static-deploy.html "Vite static deployment guide"
[3]: https://supabase.com/docs/guides/api/api-keys "Supabase API keys documentation"
