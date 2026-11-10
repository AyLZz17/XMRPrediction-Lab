# Frontend Enterprise

## Descripción
Habilidad para el desarrollo de interfaces de usuario empresariales modernas, escalables y accesibles.

## Tecnologías principales
- **Frameworks**: React, Angular, Vue.js, Next.js, Nuxt
- **Lenguajes**: TypeScript, JavaScript (ES6+), HTML5, CSS3
- **Estado**: Redux, Zustand, Pinia, NgRx, React Query
- **Estilos**: Tailwind CSS, SCSS, CSS Modules, Styled Components, Material UI, Ant Design
- **Build tools**: Vite, Webpack, Rollup, esbuild, Turbopack

## Patrones y prácticas
- Componentes reutilizables y composables
- Design Systems y Storybook
- Micro-frontends
- Server-Side Rendering (SSR) y Static Site Generation (SSG)
- Progressive Web Apps (PWA)
- Code splitting y lazy loading
- Accesibilidad WCAG 2.1 AA
- Internacionalización (i18n) y localización (l10n)

## Testing
- Unit testing: Jest, Vitest, Testing Library
- E2E: Cypress, Playwright
- Visual regression: Chromatic, Percy
- Coverage mínimo: 80%

## Performance
- Core Web Vitals (LCP, FID, CLS)
- Bundle analysis
- Tree shaking
- Memoización y optimización de renders
- CDN y caching strategies

## Estructura recomendada
```
src/
├── components/       # Componentes reutilizables
├── features/         # Módulos por funcionalidad
├── hooks/            # Custom hooks
├── services/         # API calls
├── stores/           # Estado global
├── utils/            # Utilidades
├── types/            # Tipos TypeScript
├── assets/           # Recursos estáticos
└── styles/           # Estilos globales
```
