import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
export default defineConfig({
  site: 'https://teal-insights.github.io',
  base: '/QCraft-App/docs/',
  trailingSlash: 'always',
  integrations: [starlight({
    title: 'Q-CRAFT Explorer',
    description: 'Review the assumptions, evidence and code behind Q-CRAFT Explorer.',
    customCss: ['./src/styles/brand.css'],
    components: { Footer: './src/components/Footer.astro' },
    social: [{ icon: 'github', label: 'Source code', href: 'https://github.com/Teal-Insights/QCraft-App' }],
    sidebar: [
      {label:'Start here',slug:'index'},
      {label:'For reviewers',slug:'reviewers'},
      {label:'Assumptions',slug:'assumptions'},
      {label:'Verification',slug:'verification'},
      {label:'Architecture',slug:'architecture'},
      {label:'Data',slug:'data'},
      {label:'Run and reproduce',slug:'reproduce'},
      {label:'Reference',slug:'reference'},
      {label:'Release notes',slug:'release-notes'},
      {label:'Contributing',slug:'contributing'},
    ],
  })],
});
