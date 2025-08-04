import axios from 'axios';

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateFactCheckResponse(claim, context, sources) {
    const prompt = `
You are a professional fact-checking assistant. Analyze the following claim and provide a comprehensive fact-check response.

CLAIM TO ANALYZE: "${claim}"

CONTEXT FROM TRUSTED SOURCES:
${context}

SOURCES AVAILABLE: ${JSON.stringify(sources, null, 2)}

Please provide your response in the following JSON format:
{
  "verdict": "True|False|Partially True|Unverified|Misleading",
  "confidence": 85,
  "evidence": "Clear summary of evidence supporting your verdict",
  "explanation": "Detailed explanation of your fact-checking process and reasoning",
  "sources_used": ["list", "of", "source", "names"],
  "key_points": [
    "Point 1 about the claim",
    "Point 2 about the evidence",
    "Point 3 about conclusions"
  ],
  "credibility_score": 78
}

Focus on accuracy, cite specific sources, and be objective in your analysis.
    `;

    try {
      const response = await axios.post(this.baseURL, {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        }
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate fact-check response');
    }
  }

  async detectMisinformation(articleText) {
    const prompt = `
Analyze this news article for potential misinformation indicators and bias. Provide your analysis in JSON format:

ARTICLE TO ANALYZE:
${articleText}

Return your analysis in this JSON format:
{
  "misinformation_score": 0-100,
  "bias_score": 0-100,
  "credibility_indicators": {
    "sensational_language": 0-100,
    "lack_of_sources": 0-100,
    "emotional_manipulation": 0-100,
    "factual_inconsistencies": 0-100,
    "logical_fallacies": 0-100
  },
  "positive_indicators": {
    "credible_sources_cited": 0-100,
    "balanced_reporting": 0-100,
    "factual_accuracy": 0-100,
    "professional_tone": 0-100
  },
  "summary": "Brief explanation of your analysis",
  "red_flags": ["list", "of", "concerning", "elements"],
  "strengths": ["list", "of", "positive", "elements"]
}

Be thorough and objective in your analysis.
    `;

    try {
      const response = await axios.post(this.baseURL, {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        }
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to analyze misinformation');
    }
  }

  async generateSourceCredibilityScore(source, articles) {
    const prompt = `
Evaluate the credibility of this news source based on the provided articles and general knowledge:

SOURCE: ${source}

RECENT ARTICLES:
${articles.map(article => `Title: ${article.title}\nContent: ${article.content?.substring(0, 500)}...`).join('\n\n')}

Provide credibility assessment in JSON format:
{
  "overall_credibility": 0-100,
  "factors": {
    "editorial_standards": 0-100,
    "fact_checking_history": 0-100,
    "source_transparency": 0-100,
    "bias_level": 0-100,
    "accuracy_track_record": 0-100
  },
  "reputation": "Excellent|Good|Fair|Poor|Unreliable",
  "bias_direction": "Left|Center-Left|Center|Center-Right|Right|Mixed",
  "strengths": ["list", "of", "strengths"],
  "concerns": ["list", "of", "concerns"],
  "recommendation": "Brief recommendation for readers"
}
    `;

    try {
      const response = await axios.post(this.baseURL, {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        }
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { error: 'Failed to assess source credibility', overall_credibility: 50 };
    }
  }

  parseResponse(response) {
    try {
      const text = response.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a structured response
      return {
        error: 'No JSON found in response',
        raw_response: text,
        verdict: 'Unverified',
        confidence: 50,
        explanation: text
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        error: 'Failed to parse response',
        raw_response: response,
        verdict: 'Error',
        confidence: 0
      };
    }
  }
}

export default GeminiClient;
