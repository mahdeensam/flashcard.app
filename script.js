// OpenAI API integration for generating flashcards from text
const OPENAI_API_KEY = "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";

// Default flashcard category
let defaultCategory = "General";
let categories = [defaultCategory];

// Get the category input and delete button elements
const categoryInput = document.getElementById('category');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');

// Load flashcards from localStorage when the page loads
window.addEventListener('load', () => {
    const savedFlashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
    savedFlashcards.forEach(flashcardData => {
        addFlashcardToDOM(flashcardData.question, flashcardData.answer, flashcardData.category);
    });
    document.getElementById('question').focus(); // Autofocus on question input field
});

// Add an event listener to show or hide the delete button
categoryInput.addEventListener('input', () => {
    if (categoryInput.value.trim() === '') {
        deleteCategoryBtn.classList.remove('visible');
    } else {
        deleteCategoryBtn.classList.add('visible');
    }
});

// Function to delete the category (clear the input field and related flashcards)
function deleteCategory() {
    const categoryToDelete = categoryInput.value.trim();
    if (categoryToDelete === '') return; // Don't proceed if category is empty

    // Clear the input field and hide the delete button
    categoryInput.value = '';
    deleteCategoryBtn.classList.remove('visible');
    categoryInput.focus();

    // Remove flashcards associated with this category
    removeCategoryFlashcards(categoryToDelete);
}

function removeCategoryFlashcards(category) {
    // Get flashcards from localStorage
    const flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];

    // Filter out flashcards that belong to the deleted category
    const updatedFlashcards = flashcards.filter(flashcard => flashcard.category !== category);

    // Update localStorage with the remaining flashcards
    localStorage.setItem('flashcards', JSON.stringify(updatedFlashcards));

    // Remove flashcards from the DOM
    const categorySection = document.getElementById(`category-${category}`);
    if (categorySection) {
        categorySection.remove();
    }

    // Remove the category from the list of categories
    categories = categories.filter(cat => cat !== category);
}

function addFlashcard() {
    const question = document.getElementById('question').value;
    const answer = document.getElementById('answer').value;
    let category = document.getElementById('category').value.trim() || defaultCategory;  // Use provided category or default

    // Ensure that both question and answer are provided
    if (question === '' || answer === '') {
        alert('Please fill out both question and answer!');
        return;
    }

    // Save flashcard data
    const flashcardData = { question, answer, category };
    const savedFlashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
    savedFlashcards.push(flashcardData);
    localStorage.setItem('flashcards', JSON.stringify(savedFlashcards));

    // Add new category to the list if it doesn't exist
    if (!categories.includes(category)) {
        categories.push(category);
    }

    // Add flashcard to the DOM
    addFlashcardToDOM(question, answer, category);

    // Clear only the question and answer input fields (not the category)
    document.getElementById('question').value = '';
    document.getElementById('answer').value = '';
    document.getElementById('question').focus(); // Refocus on the question input
}

function addFlashcardToDOM(question, answer, category) {
    const flashcardContainer = document.getElementById('flashcard-container');

    // Check if a section for the current category already exists
    let categorySection = document.getElementById(`category-${category}`);
    if (!categorySection) {
        // Create a new section for the category if it doesn't exist
        categorySection = document.createElement('div');
        categorySection.id = `category-${category}`;
        categorySection.className = 'category-section';

        const categoryHeader = document.createElement('h2');
        categoryHeader.textContent = category;
        categorySection.appendChild(categoryHeader);

        // Create a container for flashcards under this category
        const flashcardContainerDiv = document.createElement('div');
        flashcardContainerDiv.className = 'flashcard-container'; // Flex container for flashcards
        categorySection.appendChild(flashcardContainerDiv);

        // Append the new category section to the main flashcard container
        flashcardContainer.appendChild(categorySection);
    }

    // Create the flashcard element
    const flashcard = document.createElement('div');
    flashcard.className = 'flashcard';
    flashcard.setAttribute('draggable', 'true'); // Enable drag functionality (optional)
    flashcard.setAttribute('ondragstart', 'drag(event)');
    flashcard.addEventListener('click', function() {
        flipCard(flashcard); // Attach the flip event to the card itself
    });

    // Create front and back divs for the flashcard
    const front = document.createElement('div');
    front.className = 'front';
    front.innerHTML = `<span>Question</span><div>${question}</div>`; // Properly formatted front side

    const back = document.createElement('div');
    back.className = 'back';
    back.innerHTML = `<span>Answer</span><div>${answer}</div>`; // Properly formatted back side

    // Append front and back to flashcard
    flashcard.appendChild(front);
    flashcard.appendChild(back);

    // Add an "X" delete button in the top-right corner of the flashcard
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = "×"; // Unicode for X
    deleteBtn.className = 'delete-x-btn';
    deleteBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent flipping when deleting
        confirmAndDeleteFlashcard(flashcard, question);
    };

    // Append the delete button inside the flashcard
    flashcard.appendChild(deleteBtn);

    // Append the flashcard to the correct category container
    const flashcardContainerDiv = categorySection.querySelector('.flashcard-container');
    flashcardContainerDiv.appendChild(flashcard);
}

// Function to flip flashcards
function flipCard(card) {
    card.classList.toggle('flipped');
}

// Function to confirm and delete a flashcard
function confirmAndDeleteFlashcard(flashcard, question) {
    // Show a confirmation prompt
    if (confirm('Are you sure you want to delete this flashcard?')) {
        deleteFlashcard(flashcard, question);
    }
}

// Delete a specific flashcard
function deleteFlashcard(flashcard, question) {
    const flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];

    // Filter out the flashcard to delete it from localStorage
    const updatedFlashcards = flashcards.filter(fc => fc.question !== question);
    localStorage.setItem('flashcards', JSON.stringify(updatedFlashcards));

    // Remove the flashcard from the DOM
    flashcard.remove();
}

// Clear all flashcards from localStorage and DOM
function clearFlashcards() {
    localStorage.removeItem('flashcards');
    const flashcardContainer = document.getElementById('flashcard-container');
    flashcardContainer.innerHTML = ''; // Clear the DOM
}

// Function to generate flashcards from text using OpenAI API
async function generateFlashcards() {
    const textInput = document.getElementById('textInput').value;
    let category = document.getElementById('category').value.trim() || defaultCategory;  // Use provided category or default
    
    if (!textInput) {
        alert("Please input some text to generate flashcards.");
        return;
    }

    try {
        // Call OpenAI API to extract flashcards
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an assistant that generates educational flashcards." },
                    { role: "user", content: `Extract the most important terms or questions and their answers from the following text:\n\n${textInput}\n\nGenerate them in the format of question-answer flashcards.` }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const flashcards = data.choices[0].message.content.trim().split('\n').filter(line => line.includes('Question:') || line.includes('Answer:'));

        // Add the generated flashcards to the DOM under the correct category
        for (let i = 0; i < flashcards.length; i += 2) {
            const question = flashcards[i].replace('Question: ', '').trim();
            const answer = flashcards[i + 1].replace('Answer: ', '').trim();
            addFlashcardToDOM(question, answer, category); // Adds them under the selected or default category
        }
    } catch (error) {
        console.error('Error generating flashcards:', error);
        alert('Error generating flashcards. Please check the console for more details.');
    }
}
