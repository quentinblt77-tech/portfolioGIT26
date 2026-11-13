// Interactions du portfolio : apparitions au défilement, menu actif,
// barre de progression de lecture et bouton de retour en haut.
// Sans JavaScript, le site reste entièrement lisible.

document.documentElement.classList.add('js-actif');

document.addEventListener('DOMContentLoaded', () => {
    const reduireAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observateurDispo = 'IntersectionObserver' in window;

    // ---------- Apparition des blocs au défilement ----------
    const GRILLES = '.grille-quatre-colonnes, .grille-trois-cartes-centree, .grille-fichiers-pdf, .grille-cartes-projets, .grille-documents, .frise-chronologique-standard, .frise-chronologique-education, .blocs-options-bts, .liste-infos-perso, .periodes-stage';

    const blocs = document.querySelectorAll(
        '.section-generale .conteneur-principal > *, .grille-quatre-colonnes > *, .grille-trois-cartes-centree > *, .grille-fichiers-pdf > *, .grille-cartes-projets > *, .grille-documents > *, .blocs-options-bts > *, .liste-infos-perso > *, .periodes-stage > *, .element-frise-standard, .element-frise-chrono, .bloc-certifications > *, .bloc-photo-profil, .bloc-texte-presentation'
    );

    // Si le système demande de réduire les animations, le CSS remplace les
    // glissements par de simples fondus : le script, lui, fait la même chose.
    if (observateurDispo) {
        const DUREE = 700;      // durée de l'apparition (ms), identique à celle du CSS
        const DECALAGE = 80;    // écart entre deux éléments voisins d'une même grille (ms)

        const observateur = new IntersectionObserver((entrees) => {
            entrees.forEach((entree) => {
                if (!entree.isIntersecting) return;
                const bloc = entree.target;
                bloc.classList.add('visible');
                observateur.unobserve(bloc);

                // Une fois l'apparition terminée, on retire les classes d'animation :
                // la carte retrouve ses propres transitions (survol, bordure...).
                const retard = parseFloat(bloc.style.transitionDelay || '0') * 1000;
                setTimeout(() => {
                    bloc.classList.remove('apparition', 'visible');
                    bloc.style.transitionDelay = '';
                }, DUREE + retard + 500);
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        blocs.forEach((bloc) => {
            // Les grilles animent leurs éléments un par un, pas le bloc entier
            if (bloc.matches(GRILLES) || bloc.matches('.grille-deux-colonnes-presentation, .grille-formation, .bloc-certifications')) return;

            // Dans une grille, chaque élément arrive un peu après son voisin
            const parent = bloc.parentElement;
            if (parent && parent.matches(GRILLES + ', .bloc-certifications')) {
                const rang = [...parent.children].indexOf(bloc);
                bloc.style.transitionDelay = Math.min(rang, 6) * DECALAGE + 'ms';
            }

            bloc.classList.add('apparition');
            observateur.observe(bloc);
        });

        // Le trait de la frise du parcours se dessine quand elle arrive à l'écran
        const frises = document.querySelectorAll('.frise-chronologique-education');
        const observateurFrise = new IntersectionObserver((entrees) => {
            entrees.forEach((entree) => {
                if (!entree.isIntersecting) return;
                entree.target.classList.add('frise-tracee');
                observateurFrise.unobserve(entree.target);
            });
        }, { rootMargin: '0px 0px -15% 0px' });
        frises.forEach((frise) => {
            frise.classList.add('frise-a-tracer');
            observateurFrise.observe(frise);
        });
    }

    // ---------- Lien du menu correspondant à la section visible ----------
    const groupeLiens = document.querySelector('.groupe-liens-nav');
    const liensAncre = [...document.querySelectorAll('.groupe-liens-nav a[href^="#"]')];
    const sections = liensAncre
        .map((lien) => document.querySelector(lien.getAttribute('href')))
        .filter(Boolean);

    // Sur les pages détail, un seul lien pointe vers la page elle-même (Contact) :
    // on ne touche pas au menu, le lien « Projets » ou « Veille » reste actif.
    if (sections.length > 1 && observateurDispo) {
        const activer = (id) => {
            liensAncre.forEach((lien) => {
                const actif = lien.getAttribute('href') === '#' + id;
                lien.classList.toggle('lien-nav-actif', actif);

                // Sur mobile, le menu défile tout seul pour garder le lien actif visible
                if (actif && groupeLiens && groupeLiens.scrollWidth > groupeLiens.clientWidth) {
                    const cible = lien.offsetLeft - (groupeLiens.clientWidth - lien.offsetWidth) / 2;
                    groupeLiens.scrollTo({ left: cible, behavior: reduireAnimations ? 'auto' : 'smooth' });
                }
            });
        };

        const observateurMenu = new IntersectionObserver((entrees) => {
            entrees.forEach((entree) => {
                if (entree.isIntersecting) activer(entree.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach((section) => observateurMenu.observe(section));
    }

    // ---------- Barre de progression et bouton de retour en haut ----------
    const barreNav = document.querySelector('.barre-navigation-fixe');

    const progression = document.createElement('div');
    progression.className = 'barre-progression';
    progression.setAttribute('aria-hidden', 'true');
    if (barreNav) barreNav.appendChild(progression);

    const retourHaut = document.createElement('a');
    retourHaut.href = '#';
    retourHaut.className = 'retour-haut';
    retourHaut.setAttribute('aria-label', 'Retour en haut de la page');
    retourHaut.addEventListener('click', (evenement) => {
        evenement.preventDefault();
        window.scrollTo({ top: 0, behavior: reduireAnimations ? 'auto' : 'smooth' });
    });
    document.body.appendChild(retourHaut);

    let miseAJourPrevue = false;
    const mettreAJour = () => {
        miseAJourPrevue = false;
        const hauteurTotale = document.documentElement.scrollHeight - window.innerHeight;
        const avancement = hauteurTotale > 0 ? Math.min(window.scrollY / hauteurTotale, 1) : 0;
        progression.style.transform = 'scaleX(' + avancement + ')';
        if (barreNav) barreNav.classList.toggle('nav-defilee', window.scrollY > 12);
        retourHaut.classList.toggle('retour-haut-visible', window.scrollY > window.innerHeight * 0.8);
    };
    const demanderMiseAJour = () => {
        if (miseAJourPrevue) return;
        miseAJourPrevue = true;
        requestAnimationFrame(mettreAJour);
    };

    window.addEventListener('scroll', demanderMiseAJour, { passive: true });
    window.addEventListener('resize', demanderMiseAJour);
    mettreAJour();
});
