# Volodymyr Bondar Portfolio

Personal portfolio website showcasing my experience, work approach, and resume, with options to connect via social media. The site offers a stylish and functional experience, presenting both light and dark themes and supporting internationalization in multiple languages.

## Features

- **Internationalization**: The website is available in multiple languages, enhancing accessibility for a diverse audience.
- **Theming**: Users can switch between light and dark themes for an optimal viewing experience.
- **Dynamic Animations**: Framer Motion enhances user interaction with smooth and engaging animations.
- **Contact Options**: Visitors can access my resume or connect via social media links for easy communication.

## Technology Stack

- **TypeScript**: Ensures strong typing for maintainable and reliable code.
- **React** & **Next.js**: Powers the website’s dynamic user interface and enables server-side rendering and static site generation.
- **Tailwind CSS**: Provides a responsive and modern design, allowing rapid UI development.
- **Framer Motion**: Used for advanced animations and transitions to create an engaging experience.
- **next-intl**: Manages multilingual content seamlessly.
- **next-themes**: Implements theme switching between light and dark modes.
- **three.js**: Adds 3D elements for a unique visual effect.
- **aceternity**: Enhances site functionality.
- **marquee**: Creates a moving marquee effect for a stylish text flow.

## Local development

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Before shipping, run `npm run lint`, `npm run typecheck`, and `npm run build`.
Use `npm start` to check the production build locally. The site supports `/ua`
(default) and `/en`. See [AGENTS.md](AGENTS.md) for project conventions and browser checks.

Vercel uses Node.js `24.x` from `package.json`; the build logs print the actual runtime.
Dependency/runtime updates and UI/UX changes should be shipped separately.

## Contact

For any questions or collaboration inquiries, feel free to reach out via the contact links provided on the site.

---

This README provides an overview of the **VolodymyrBondar** portfolio project, detailing its features and technology stack.
