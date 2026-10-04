const languageLabels = {
    da: 'Dansk',
    en: 'English'
};

// ************************************************************
// DOM REFERENCES
// ************************************************************

const pageTitle = document.getElementById('pageTitle');

// ************************************************************
// RENDER LANGUAGE
// ************************************************************

export function renderLanguage(state) {

    pageTitle.textContent = state.title;
    document.documentElement.lang = state.language;

    currentFlag.src = `/images/flag-${state.language}.svg`;
    currentLanguageText.textContent = languageLabels[state.language];

}

// ************************************************************
// LOAD LANGUAGE
// ************************************************************

export async function loadLanguage() {

    const response = await fetch('/api/language');

    if (!response.ok) {

        throw new Error('Could not load language.');
    }

    const state = await response.json();

    renderLanguage(state);
}

// ************************************************************
// LANGUAGE INIT
// ************************************************************

export async function initializeLanguageSelector() {

    const container = document.getElementById('languageSelector');
    const response = await fetch('/Pages/PartialView/languageSelector.html');

    if (!response.ok) {
        throw new Error('Could not load language selector.');
    }

    container.innerHTML = await response.text();

    const languageButton = document.getElementById('languageButton');
    const languageMenu = document.getElementById('languageMenu');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentFlag = document.getElementById('currentFlag');
    const currentLanguageText = document.getElementById('currentLanguageText');


    // ************************************************************
    // LANGUAGE DROPDOWN
    // ************************************************************

    languageButton.addEventListener('click', event => {
        event.stopPropagation();
        languageMenu.hidden = !languageMenu.hidden;
        languageButton.setAttribute('aria-expanded', String(!languageMenu.hidden));
    });

    // ************************************************************
    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    // ************************************************************

    document.addEventListener('click', event => {

        if (!languageDropdown.contains(event.target)) {

            languageMenu.hidden = true;
            languageButton.setAttribute('aria-expanded', 'false');
        }
    });

    // ************************************************************
    // LANGUAGE SELECTION
    // ************************************************************

    languageMenu
        .querySelectorAll('button[data-language]')
        .forEach(button => {

            button.addEventListener(
                'click',
                async () => {

                    try {

                        const response = await fetch(
                            '/api/language',
                            {
                                method: 'POST',
                                headers:
                                {
                                    'Content-Type': 'application/json'
                                },

                                body:
                                    JSON.stringify
                                        ({
                                            language:
                                                button.dataset.language
                                        })
                            }
                        );


                        if (!response.ok) {

                            throw new Error('Could not change language.');
                        }

                        const state = await response.json();

                        renderLanguage(state);
                    }
                    catch (error) {
                        throw new Error(error.message);
                    }

                    languageMenu.hidden = true;
                    languageButton.setAttribute('aria-expanded', 'false');
                }
            );
        });
}




