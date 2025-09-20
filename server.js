const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate-account-plan', async (req, res) => {
  try {
    const { company, contacts, competitors } = req.body;

    const aviatrixContext = `You are an expert on Aviatrix's Cloud Network Security Fabric (CNSF) offering.

    CRITICAL SECURITY INSIGHT: Most companies have a dangerous blind spot - while they've secured their perimeter (north-south traffic),
    they have minimal visibility or control over EAST-WEST traffic inside their cloud environments and EGRESS data exfiltration.
    Once attackers breach the perimeter, they can move laterally between workloads unchecked and exfiltrate data freely.

    AVIATRIX CNSF's KEY DIFFERENTIATOR:
    - We DON'T compete on perimeter security (others do that well)
    - We UNIQUELY secure the overlooked attack vectors:
      • EAST-WEST traffic: Full visibility and micro-segmentation between workloads
      • EGRESS control: Prevent data exfiltration with intelligent egress filtering
      • Lateral movement prevention: Stop attackers from spreading after initial breach
    - We do this more elegantly than legacy approaches (complex firewall rules, manual policies)

    SALES STRATEGY: Help customers realize they have this UNADDRESSED RISK:
    - "Your perimeter is secured, but what happens AFTER a breach?"
    - "Can you see/control traffic between your cloud workloads?"
    - "How do you prevent data exfiltration once someone's inside?"

    Additional CNSF capabilities:
    - Zero-trust network architecture with encryption everywhere
    - Simplified multi-cloud network management
    - High-performance without compromising security
    - DevOps-friendly automation and APIs`;

    const prompt = `${aviatrixContext}

    Now research and create a brief, executive-level account plan for selling Aviatrix CNSF to ${company}.
    ${contacts ? `Key contacts to research: ${contacts}` : 'Research and identify key security contacts.'}
    ${competitors ? `Known competitors: ${competitors}` : 'Research and identify likely competitors.'}

    The account plan should include:
    1. Company overview and current security posture assessment
    2. RISK ASSESSMENT: Identify their east-west and egress security gaps
       - Do they have visibility into lateral movement?
       - How are they preventing data exfiltration?
       - What's their post-breach containment strategy?
    3. Key stakeholders and how to message the OVERLOOKED RISK to each:
       - CISO: "Your perimeter is strong, but you're blind to lateral movement"
       - CIO: "Cloud migration created new attack surfaces you can't see"
       - Security team: "You need defense-in-depth beyond the perimeter"
    4. Competitive landscape and why traditional solutions miss this risk
    5. Risk-based sales approach:
       - Lead with the SECURITY GAP they haven't addressed
       - Position CNSF as the elegant solution to this specific blind spot
       - Quantify the risk of uncontrolled east-west traffic

    Focus on helping them realize they have an UNRECOGNIZED VULNERABILITY.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ accountPlan: response.content[0].text });
  } catch (error) {
    console.error('Error generating account plan:', error.message, error);
    res.status(500).json({ error: 'Failed to generate account plan: ' + error.message });
  }
});

app.post('/api/coaching-chat', async (req, res) => {
  try {
    const { company, competitors, conversationHistory, userMessage } = req.body;

    const prompt = `You are playing the role of a CISO/Security Leader at ${company}.
    ${competitors ? `The company is also evaluating: ${competitors}` : ''}

    Your current security posture:
    - Strong perimeter security (firewalls, WAF, IDS/IPS)
    - BUT you haven't fully addressed east-west traffic visibility or egress control
    - You're not fully aware this is a major risk (like most companies)

    Your role is to:
    - Initially focus on traditional perimeter security concerns
    - Be skeptical when the rep mentions east-west/egress risks ("We have firewalls for that")
    - Gradually realize you DO have this blind spot as the rep educates you
    - Challenge them to prove why this risk matters for ${company} specifically
    - Ask: "Hasn't our perimeter security been enough?"
    - Push back: "Is lateral movement really that big of a risk?"
    - Test their knowledge: "How exactly would an attacker exploit this?"

    Previous conversation:
    ${conversationHistory || 'This is the start of the conversation.'}

    Sales rep says: ${userMessage}

    Respond as a CISO who DOESN'T initially see east-west/egress as a priority risk.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Error in coaching chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/api/coaching-feedback', async (req, res) => {
  try {
    const { conversationHistory } = req.body;

    const prompt = `Review this sales conversation where a rep was selling Aviatrix CNSF.

    Conversation:
    ${conversationHistory}

    CRITICAL ASSESSMENT: Did they successfully help the customer realize their EAST-WEST SECURITY GAP?

    Provide brief, actionable feedback on:
    1. RISK EDUCATION: Did they help the customer understand their lateral movement blind spot?
       - Did they lead with the security gap, not product features?
       - Did they quantify the risk of uncontrolled east-west traffic?
    2. DISCOVERY: Did they ask the right questions?
       - "What happens after a breach of your perimeter?"
       - "How do you track lateral movement between workloads?"
       - "How do you prevent data exfiltration from inside?"
    3. OBJECTION HANDLING: How well did they overcome:
       - "Our perimeter security is sufficient"
       - "We haven't had issues with lateral movement"
       - "This seems like an edge case risk"
    4. POSITIONING: Did they clearly differentiate from perimeter-focused competitors?
    5. Specific tips for better RISK-BASED selling next time

    Focus on whether they made the customer FEEL THE RISK they didn't know they had.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ feedback: response.content[0].text });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

app.post('/api/competitor-battlecards', async (req, res) => {
  try {
    const { competitors, company } = req.body;

    let primaryCompetitor = '';

    // If no competitors provided, research to find likely competitors
    if (!competitors) {
      const researchPrompt = `Research and identify the most likely network security competitor for Aviatrix CNSF when selling to ${company}.
      Consider ${company}'s industry, size, and typical security requirements.
      Return ONLY the company name of ONE primary competitor, nothing else. Just the name (e.g., "Palo Alto Networks" or "Cisco" or "Fortinet").
      Do not include any explanation, reasoning, or additional text.`;

      const researchResponse = await anthropic.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 50,
        messages: [{ role: 'user', content: researchPrompt }],
      });

      // Extract just the competitor name, removing any extra text
      const responseText = researchResponse.content[0].text.trim();
      // Try to extract just the company name if there's extra text
      const match = responseText.match(/(?:^|\n)([A-Z][A-Za-z\s&]+(?:Networks?|Systems?|Technologies)?)/);
      primaryCompetitor = match ? match[1].trim() : responseText.split('\n')[0].replace(/[*:]/g, '').trim();
    } else {
      primaryCompetitor = competitors.split(',')[0].trim();
    }

    const prompt = `You are a sales analyst from ${primaryCompetitor}. Describe how you would position your product against Aviatrix CNSF when selling to ${company}.

    ${!competitors ? `(Note: ${primaryCompetitor} was identified as the most likely competitor based on ${company}'s profile)` : ''}

    Provide:
    1. Your key selling points against Aviatrix
    2. How you would DEFLECT from the east-west/egress risk (since you don't solve it as well)
    3. Your strategy to keep focus on perimeter security (your strength)
    4. How you'd downplay the lateral movement risk Aviatrix highlights
    5. Your FUD tactics: "Aviatrix is complex", "It's expensive", "Perimeter is enough"
    6. Objection handling when ${company} asks about east-west visibility

    Be detailed and strategic. Show how you'd try to minimize the importance of the security gap Aviatrix addresses.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({
      battlecards: response.content[0].text,
      primaryCompetitor: primaryCompetitor
    });
  } catch (error) {
    console.error('Error generating battlecards:', error);
    res.status(500).json({ error: 'Failed to generate battlecards' });
  }
});

app.post('/api/analyst-report', async (req, res) => {
  try {
    const { company, competitors } = req.body;

    const prompt = `You are an objective analyst working for ${company}'s leadership team, reporting to the CISO.

    Create an unbiased security vendor recommendation for ${company}.
    Compare Aviatrix CNSF with: ${competitors || 'other market alternatives'}

    CRITICAL SECURITY CONSIDERATIONS for ${company}:
    1. PERIMETER SECURITY (North-South): How well does each vendor protect ingress?
    2. INTERNAL SECURITY (East-West): How well does each vendor provide:
       - Visibility into lateral movement between workloads
       - Micro-segmentation capabilities
       - Zero-trust between internal resources
    3. DATA EXFILTRATION (Egress): How well does each vendor:
       - Monitor and control outbound traffic
       - Prevent unauthorized data extraction
       - Detect suspicious egress patterns

    Your recommendation should:
    1. Assess ${company}'s current security gaps, especially:
       - Are we blind to lateral movement after a breach?
       - Can we detect/prevent data exfiltration?
       - Do we have adequate east-west visibility?
    2. Compare how each vendor addresses ALL THREE attack vectors
    3. Identify which risks are NOT adequately covered by each solution
    4. Recommend the optimal approach (could be one vendor or combination)
    5. Be honest about trade-offs and remaining gaps

    Be objective - if ${company} has dangerous blind spots in east-west/egress security, say so clearly.
    Base recommendations on comprehensive security, not just perimeter protection.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ report: response.content[0].text });
  } catch (error) {
    console.error('Error generating analyst report:', error);
    res.status(500).json({ error: 'Failed to generate analyst report' });
  }
});

app.post('/api/sales-analyst-chat', async (req, res) => {
  try {
    const { company, competitors, message, accountPlan } = req.body;

    const prompt = `You are an expert sales analyst who has created an account plan for selling Aviatrix CNSF to ${company}.
    ${competitors ? `Known competitors: ${competitors}` : ''}

    The account plan you created:
    ${accountPlan}

    KEY SALES STRATEGY: Help ${company} realize they have an OVERLOOKED SECURITY RISK:
    - Their perimeter is secured but they're BLIND to lateral movement
    - They can't see or control east-west traffic between workloads
    - They have no real egress control to prevent data exfiltration
    - This is the #1 way breaches spread and data gets stolen

    The sales rep has a follow-up question or request:
    "${message}"

    Provide a helpful response focused on RISK-BASED SELLING:
    - Help craft discovery questions to uncover their east-west blind spots
    - Suggest ways to quantify the risk of uncontrolled lateral movement
    - Provide talk tracks for educating them on this overlooked threat
    - Share examples of breaches that exploited east-west vulnerabilities
    - Coach on overcoming "our perimeter is enough" objections
    - Emphasize: We're not competing on perimeter - we're solving what happens AFTER

    Always tie back to the UNADDRESSED RISK they don't know they have.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Error in sales analyst chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/api/competitor-analyst-chat', async (req, res) => {
  try {
    const { company, primaryCompetitor, message, battlecards } = req.body;

    const prompt = `You are a sales analyst from ${primaryCompetitor} who created the battle card for competing against Aviatrix CNSF at ${company}.

    Your battle card/positioning:
    ${battlecards}

    KEY WEAKNESS: You know Aviatrix will highlight ${company}'s east-west/egress blind spot - an area where you're weaker.
    Your strategy is to DEFLECT from this risk and keep focus on areas where you're stronger (usually perimeter/north-south).

    A sales rep is asking you:
    "${message}"

    Respond from the perspective of ${primaryCompetitor}'s sales analyst. You can:
    - Share how you MINIMIZE the importance of east-west security
    - Provide talk tracks to DEFLECT to your strengths
    - Explain how you create DOUBT about Aviatrix's approach:
      • "It's overly complex for a niche problem"
      • "Most breaches still come through the perimeter"
      • "Your existing tools can handle lateral movement"
    - Coach on keeping the conversation on YOUR strengths
    - Suggest FUD about Aviatrix being "single purpose" or "expensive"

    Show how you'd try to win despite NOT addressing the core risk Aviatrix solves.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Error in competitor analyst chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/api/company-analyst-chat', async (req, res) => {
  try {
    const { company, competitors, message, analystReport } = req.body;

    const prompt = `You are an analyst working for ${company}'s leadership team, specifically for their CISO and security organization.
    ${competitors ? `You are evaluating: Aviatrix CNSF and ${competitors}` : ''}

    Your previous analysis/recommendation:
    ${analystReport}

    KEY SECURITY PRIORITIES for ${company}:
    - Perimeter defense (we have this mostly covered)
    - East-West visibility and control (major gap we've identified)
    - Egress monitoring and data loss prevention (another gap)
    - Post-breach containment capabilities

    Someone is asking you:
    "${message}"

    Respond from the perspective of ${company}'s internal analyst. You can:
    - Explain how each vendor addresses our THREE attack vectors (perimeter, east-west, egress)
    - Discuss why east-west and egress gaps are critical risks for ${company}
    - Share specific scenarios of how attackers could exploit our current blind spots
    - Explain budget vs. risk trade-offs
    - Be honest about which security gaps worry you most
    - Discuss implementation complexity for comprehensive coverage

    Remember: You're concerned about ${company}'s COMPLETE security posture, not just the perimeter.
    If asked, acknowledge that most companies (including us) have underinvested in east-west/egress security.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error('Error in company analyst chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});