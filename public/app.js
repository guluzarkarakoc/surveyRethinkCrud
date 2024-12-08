document.addEventListener('DOMContentLoaded', () => {
    const surveyForm = document.getElementById('survey-form');
    const surveysDiv = document.getElementById('surveys');
    const addOptionBtn = document.getElementById('add-option');
    const optionsDiv = document.getElementById('options');

    addOptionBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Seçenek ${optionsDiv.children.length + 1}`;
        input.required = true;
        optionsDiv.appendChild(input);
    });
    surveyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const question = document.getElementById('question').value;
        const options = Array.from(optionsDiv.querySelectorAll('input')).map(input => ({
            text: input.value,
            votes: 0,
        }));
        fetch('/surveys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, options }),
        })
            .then(res => res.json())
            .then(survey => rendersurvey(survey));
        
        surveyForm.reset();
        optionsDiv.innerHTML = '';
    });
    fetch('/surveys')
        .then(res => res.json())
        .then(surveys => surveys.forEach(rendersurvey));
    function vote(surveyId, optionIndex) {
        fetch(`/surveys/${surveyId}/vote/${optionIndex}`, { method: 'POST' })
            .then(res => res.json())
            .then(updatedsurvey => {
                surveysDiv.innerHTML = '';
                rendersurvey(updatedsurvey);
            });
    }
    function rendersurvey(survey) {
        const surveyDiv = document.createElement('div');
        surveyDiv.classList.add('survey');
        surveyDiv.innerHTML = `<h2>${survey.question}</h2>`;
        survey.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.innerHTML = `
                ${option.text} (${option.votes} oy) 
                <button onclick="vote('${survey.id}', ${index})">Oy Ver</button>
            `;
            surveyDiv.appendChild(optionDiv);
        });
        surveysDiv.appendChild(surveyDiv);
    }
});