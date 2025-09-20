let currentCompany = '';
let currentCompetitors = '';
let primaryCompetitor = '';
let conversationHistory = [];

document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        company: document.getElementById('company').value,
        contacts: document.getElementById('contacts').value,
        competitors: document.getElementById('competitors').value
    };

    currentCompany = formData.company;
    currentCompetitors = formData.competitors;

    await generateAccountPlan(formData);
});

async function generateAccountPlan(formData) {
    showLoading(true);
    document.getElementById('outputs').style.display = 'none';
    document.getElementById('analyst-guide').style.display = 'none';
    document.getElementById('chat-section').style.display = 'none';

    try {
        const response = await fetch('/api/generate-account-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.accountPlan) {
            displayGuide(formData.company, formData.competitors);
            displayAccountPlan(data.accountPlan);
            document.getElementById('chat-section').style.display = 'block';
            initializeChat();
            initializeAnalystChats(formData.company);

            // Always generate battlecards
            await generateBattlecards(formData);
            await generateAnalystReport(formData);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate account plan. Please try again.');
    } finally {
        showLoading(false);
    }
}

function displayGuide(company, competitors) {
    document.getElementById('company-analyst-name').textContent = company;
    document.getElementById('company-name-guide').textContent = company;
    document.getElementById('company-name-coach').textContent = company;

    // Set competitor name - will be updated when battlecards are generated
    const competitorDisplay = competitors ? competitors.split(',')[0].trim() : 'Key Competitor';
    document.getElementById('competitor-name-guide').textContent = competitorDisplay;

    document.getElementById('analyst-guide').style.display = 'block';
}

function displayAccountPlan(content) {
    document.getElementById('account-plan').innerHTML = formatContent(content);
    document.getElementById('outputs').style.display = 'block';
    document.getElementById('account-plan-section').style.display = 'block';
    document.getElementById('sales-analyst-chat').style.display = 'block';
}

function initializeChat() {
    conversationHistory = [];
    document.getElementById('chat-messages').innerHTML = `
        <div class="message system">
            <p>You're now connected with the ${currentCompany} security leader. Start with your initial pitch about Aviatrix CNSF.</p>
        </div>
    `;

    document.getElementById('send-btn').addEventListener('click', sendChatMessage);
    document.getElementById('end-session-btn').addEventListener('click', endCoachingSession);

    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    addMessageToChat('user', message);
    input.value = '';

    conversationHistory.push({ role: 'user', content: message });

    try {
        const response = await fetch('/api/coaching-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company: currentCompany,
                competitors: currentCompetitors,
                conversationHistory: conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n'),
                userMessage: message
            })
        });

        const data = await response.json();

        if (data.response) {
            addMessageToChat('ciso', data.response);
            conversationHistory.push({ role: 'ciso', content: data.response });
        }
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('system', 'Failed to get response. Please try again.');
    }
}

function addMessageToChat(sender, message) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    let label = '';
    if (sender === 'user') label = 'You: ';
    else if (sender === 'ciso') label = `${currentCompany} CISO: `;

    messageDiv.innerHTML = `<p><strong>${label}</strong>${message}</p>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function endCoachingSession() {
    if (conversationHistory.length === 0) {
        alert('No conversation to analyze.');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/coaching-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationHistory: conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
            })
        });

        const data = await response.json();

        if (data.feedback) {
            document.getElementById('coaching-feedback').innerHTML = formatContent(data.feedback);
            document.getElementById('feedback-section').style.display = 'block';

            document.getElementById('feedback-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate feedback. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function generateBattlecards(formData) {
    try {
        const response = await fetch('/api/competitor-battlecards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                competitors: formData.competitors,
                company: formData.company
            })
        });

        const data = await response.json();

        if (data.battlecards) {
            // Update primary competitor from response
            primaryCompetitor = data.primaryCompetitor || (formData.competitors ? formData.competitors.split(',')[0].trim() : 'Key Competitor');

            // Update UI with actual competitor name
            document.getElementById('competitor-title').textContent = primaryCompetitor;
            document.getElementById('competitor-chat-title').textContent = primaryCompetitor;
            document.getElementById('competitor-name-guide').textContent = primaryCompetitor;

            document.getElementById('battlecards').innerHTML = formatContent(data.battlecards);
            document.getElementById('battlecards-section').style.display = 'block';
            document.getElementById('competitor-analyst-chat').style.display = 'block';
        }
    } catch (error) {
        console.error('Error generating battlecards:', error);
    }
}

async function generateAnalystReport(formData) {
    try {
        const response = await fetch('/api/analyst-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company: formData.company,
                competitors: formData.competitors
            })
        });

        const data = await response.json();

        if (data.report) {
            document.getElementById('company-analyst-title').textContent = formData.company;
            document.getElementById('company-analyst-chat-title').textContent = formData.company;
            document.getElementById('analyst-report').innerHTML = formatContent(data.report);
            document.getElementById('analyst-section').style.display = 'block';
            document.getElementById('company-analyst-chat').style.display = 'block';
        }
    } catch (error) {
        console.error('Error generating analyst report:', error);
    }
}

function formatContent(content) {
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(\d+\.)\s/g, '<br><strong>$1</strong> ');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function initializeAnalystChats(company) {
    // Initialize Sales Analyst Chat
    document.getElementById('sales-analyst-send').addEventListener('click', () => {
        sendAnalystMessage('sales', company);
    });

    document.getElementById('sales-analyst-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAnalystMessage('sales', company);
        }
    });

    // Initialize Competitor Analyst Chat
    document.getElementById('competitor-analyst-send').addEventListener('click', () => {
        sendAnalystMessage('competitor', company);
    });

    document.getElementById('competitor-analyst-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAnalystMessage('competitor', company);
        }
    });

    // Initialize Company Analyst Chat
    document.getElementById('company-analyst-send').addEventListener('click', () => {
        sendAnalystMessage('company', company);
    });

    document.getElementById('company-analyst-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAnalystMessage('company', company);
        }
    });
}

async function sendAnalystMessage(type, company) {
    const inputId = type === 'sales' ? 'sales-analyst-input' :
                   type === 'competitor' ? 'competitor-analyst-input' : 'company-analyst-input';
    const messagesId = type === 'sales' ? 'sales-analyst-messages' :
                       type === 'competitor' ? 'competitor-analyst-messages' : 'company-analyst-messages';

    const input = document.getElementById(inputId);
    const message = input.value.trim();

    if (!message) return;

    const messagesDiv = document.getElementById(messagesId);

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `<p><strong>You:</strong> ${message}</p>`;
    messagesDiv.appendChild(userMsg);

    input.value = '';

    // Add loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message system';
    loadingMsg.innerHTML = '<p>Analyst is thinking...</p>';
    messagesDiv.appendChild(loadingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const endpoint = type === 'sales' ? '/api/sales-analyst-chat' :
                        type === 'competitor' ? '/api/competitor-analyst-chat' :
                        '/api/company-analyst-chat';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company: company,
                competitors: currentCompetitors,
                primaryCompetitor: primaryCompetitor,
                message: message,
                accountPlan: document.getElementById('account-plan').textContent,
                battlecards: type === 'competitor' ? document.getElementById('battlecards').textContent : null,
                analystReport: type === 'company' ? document.getElementById('analyst-report').textContent : null
            })
        });

        const data = await response.json();

        // Remove loading message
        messagesDiv.removeChild(loadingMsg);

        if (data.response) {
            const analystMsg = document.createElement('div');
            analystMsg.className = 'message ciso';
            const analystLabel = type === 'sales' ? 'Sales Analyst' :
                                type === 'competitor' ? `${primaryCompetitor} Analyst` :
                                `${company} Analyst`;
            analystMsg.innerHTML = `<p><strong>${analystLabel}:</strong> ${formatContent(data.response)}</p>`;
            messagesDiv.appendChild(analystMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        messagesDiv.removeChild(loadingMsg);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'message system';
        errorMsg.innerHTML = '<p>Failed to get response. Please try again.</p>';
        messagesDiv.appendChild(errorMsg);
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}