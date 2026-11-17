import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FournisseurTheme } from './composants/ui';
import { FournisseurDonnees } from './lib/etat';
import './index.css';

const racine = document.getElementById('root');
if (!racine) throw new Error("L'element racine de la page est introuvable.");

createRoot(racine).render(
  <StrictMode>
    <FournisseurTheme>
      <FournisseurDonnees>
        <App />
      </FournisseurDonnees>
    </FournisseurTheme>
  </StrictMode>,
);
