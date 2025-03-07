/**
 * Word GPT Plus - Document Analyzer
 * Analyzes document content for readability, tone, and structure
 */

import ModelManager from '../model-manager.js';

class DocumentAnalyzer {
    constructor() {
        this.modelManager = new ModelManager();

        // Initialize NLP patterns
        this.patterns = {
            sentence: /[^.!?]+[.!?]+/g,
            paragraph: /\n\s*\n/,
            passiveVoice: /\b(?:am|is|are|was|were|be|being|been)\s+(\w+ed|built|written|done|said|known|seen)\b/gi,
            complexWords: /\b(approximately|consequently|furthermore|nevertheless|notwithstanding|regarding)\b/gi,
            adverbs: /\w+ly\b/g
        };
    }

    /**
     * Analyze readability of document content
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Readability analysis
     */
    async analyzeReadability(context, params) {
        try {
            // Get content based on target
            const content = await this._getTargetContent(context, params.target || 'selection');

            if (!content || content.length === 0) {
                throw new Error("No content to analyze");
            }

            // Calculate metrics
            const metrics = this._calculateTextMetrics(content);

            // Calculate readability scores
            const scores = this._calculateReadabilityScores(metrics);

            // Identify complex sentences
            const complexSentences = this._findComplexSentences(content);

            // Get AI recommendations if content is not too long
            let recommendations = [];
            if (content.length < 5000) {
                recommendations = await this._getAIReadabilityRecommendations(content, scores);
            }

            return {
                metrics,
                scores,
                complexSentences: complexSentences.slice(0, 5),
                recommendations,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error analyzing readability:", error);
            throw error;
        }
    }

    /**
     * Analyze tone and sentiment of document content
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Tone analysis
     */
    async analyzeTone(context, params) {
        try {
            // Get content based on target
            const content = await this._getTargetContent(context, params.target || 'selection');

            if (!content || content.length === 0) {
                throw new Error("No content to analyze");
            }

            // Analyze basic tone markers
            const toneMarkers = this._analyzeToneMarkers(content);

            // Calculate formality level
            const formality = this._assessFormality(content);

            // Get AI tone analysis
            let aiAnalysis = {};
            if (content.length < 3000) {
                aiAnalysis = await this._getAIToneAnalysis(content);
            }

            return {
                toneMarkers,
                formality,
                sentiment: this._calculateSentiment(content),
                aiAnalysis,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error analyzing tone:", error);
            throw error;
        }
    }

    /**
     * Analyze document structure (headings, sections, etc.)
     * @param {Object} context - Word context
     * @param {Object} params - Parameters
     * @returns {Promise<Object>} Structure analysis
     */
    async analyzeStructure(context, params) {
        try {
            // Document structure analysis requires whole document
            params.target = 'document';
            const content = await this._getTargetContent(context, 'document');

            // Load document sections and paragraphs
            const body = context.document.body;
            const sections = context.document.sections;
            const paragraphs = body.paragraphs;

            sections.load('body');
            paragraphs.load(['text', 'style']);

            await context.sync();

            // Identify headings
            const headings = [];
            for (let i = 0; i < paragraphs.items.length; i++) {
                const para = paragraphs.items[i];
                if (para.style && para.style.includes('Heading')) {
                    const level = parseInt(para.style.replace('Heading ', '')) || 1;
                    headings.push({
                        level,
                        text: para.text,
                        index: i
                    });
                }
            }

            // Create document outline
            const outline = this._createOutline(headings, paragraphs.items.length);

            // Analyze structure balance
            const structureBalance = this._analyzeStructureBalance(headings, paragraphs.items.length);

            return {
                sections: sections.items.length,
                paragraphs: paragraphs.items.length,
                headings,
                outline,
                structureBalance,
                recommendations: await this._getAIStructureRecommendations(outline, structureBalance),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error analyzing structure:", error);
            throw error;
        }
    }

    /**
     * Get content from specified target
     * @private
     */
    async _getTargetContent(context, target) {
        let range;

        switch (target) {
            case 'document':
                range = context.document.body;
                break;
            case 'paragraph':
                const selection = context.document.getSelection();
                const paragraphs = selection.paragraphs;
                paragraphs.load('text');
                await context.sync();
                return paragraphs.items[0]?.text || '';
            case 'selection':
            default:
                range = context.document.getSelection();
        }

        range.load('text');
        await context.sync();
        return range.text;
    }

    /**
     * Calculate basic text metrics
     * @private
     */
    _calculateTextMetrics(text) {
        const words = text.match(/\b\w+\b/g) || [];
        const sentences = text.match(this.patterns.sentence) || [];
        const paragraphs = text.split(this.patterns.paragraph).filter(p => p.trim().length > 0);

        // Count syllables (approximate)
        let syllableCount = 0;
        words.forEach(word => {
            syllableCount += this._countSyllables(word);
        });

        return {
            characterCount: text.length,
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            syllableCount,
            avgWordsPerSentence: sentences.length ? words.length / sentences.length : 0,
            avgSyllablesPerWord: words.length ? syllableCount / words.length : 0
        };
    }

    /**
     * Count syllables in a word (approximate)
     * @private
     */
    _countSyllables(word) {
        word = word.toLowerCase().trim();

        // Edge cases
        if (!word || word.length <= 2) return 1;

        // Remove non-alphabetic characters
        word = word.replace(/[^a-z]/g, '');

        // Count vowel groups
        const vowels = 'aeiouy';
        let count = 0;
        let prevIsVowel = false;

        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !prevIsVowel) {
                count++;
            }
            prevIsVowel = isVowel;
        }

        // Handle silent 'e' at end
        if (word.endsWith('e') && count > 1) {
            count--;
        }

        return Math.max(1, count);
    }

    /**
     * Calculate readability scores
     * @private
     */
    _calculateReadabilityScores(metrics) {
        // Flesch-Kincaid Grade Level
        const fleschKincaidGrade = 0.39 * metrics.avgWordsPerSentence + 11.8 * metrics.avgSyllablesPerWord - 15.59;

        // Flesch Reading Ease
        const fleschReadingEase = 206.835 - 1.015 * metrics.avgWordsPerSentence - 84.6 * metrics.avgSyllablesPerWord;

        // SMOG Index (simplified)
        const smogIndex = 1.043 * Math.sqrt(metrics.syllableCount * (30 / Math.max(1, metrics.sentenceCount))) + 3.1291;

        return {
            fleschKincaidGrade: Math.max(0, fleschKincaidGrade.toFixed(1)),
            fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase.toFixed(1))),
            smogIndex: smogIndex.toFixed(1),
            readabilityLevel: this._getReadabilityLevel(fleschReadingEase)
        };
    }

    /**
     * Get readability level description
     * @private
     */
    _getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy (5th grade)';
        if (score >= 80) return 'Easy (6th grade)';
        if (score >= 70) return 'Fairly Easy (7th grade)';
        if (score >= 60) return 'Standard (8-9th grade)';
        if (score >= 50) return 'Fairly Difficult (10-12th grade)';
        if (score >= 30) return 'Difficult (College)';
        return 'Very Difficult (College Graduate)';
    }

    /**
     * Find complex sentences in text
     * @private
     */
    _findComplexSentences(text) {
        const sentences = text.match(this.patterns.sentence) || [];

        return sentences
            .map(sentence => {
                const words = sentence.match(/\b\w+\b/g) || [];
                if (words.length < 5) return null; // Skip very short sentences

                // Calculate complexity factors
                const wordCount = words.length;
                const commaCount = (sentence.match(/,/g) || []).length;
                const semicolonCount = (sentence.match(/;/g) || []).length;
                const complexWordCount = (sentence.match(this.patterns.complexWords) || []).length;
                const avgWordLength = sentence.length / Math.max(1, wordCount);

                // Combined complexity score
                const complexityScore =
                    (wordCount / 30) +  // Length factor
                    (commaCount / 2) +  // Punctuation factor
                    (semicolonCount * 2) +
                    (complexWordCount) +  // Vocabulary factor
                    (avgWordLength / 5);  // Word length factor

                return {
                    text: sentence.trim(),
                    wordCount,
                    complexityScore: parseFloat(complexityScore.toFixed(2)),
                    reason: this._getComplexitySuggestion(complexityScore)
                };
            })
            .filter(s => s !== null)
            .sort((a, b) => b.complexityScore - a.complexityScore);
    }

    /**
     * Get explanation for sentence complexity
     * @private
     */
    _getComplexitySuggestion(score) {
        if (score > 5) return 'Very complex sentence. Consider breaking into multiple sentences.';
        if (score > 4) return 'Complex sentence with difficult structure.';
        if (score > 3) return 'Moderately complex sentence.';
        return 'Somewhat complex sentence.';
    }

    /**
     * Get AI recommendations for improving readability
     * @private
     */
    async _getAIReadabilityRecommendations(text, scores) {
        try {
            // Sample text to keep within token limits
            const sampleText = text.length > 1500 ? text.substring(0, 1500) + '...' : text;

            const prompt = `
Analyze the readability of the following text. The current metrics are:
- Flesch-Kincaid Grade Level: ${scores.fleschKincaidGrade}
- Flesch Reading Ease: ${scores.fleschReadingEase} (${scores.readabilityLevel})

Provide 3-5 specific, actionable recommendations to improve readability. Focus on:
1. Sentence structure and length
2. Word choice and vocabulary
3. Organization and flow

TEXT TO ANALYZE:
${sampleText}

Format your response as a JSON array of objects with these properties:
- tip: The recommendation
- example: A specific example from the text with a suggested improvement
`;

            const response = await this.modelManager.generateText(prompt, {
                temperature: 0.3,
                detailed: true
            });

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return parsed;
                }
            } catch (e) {
                console.warn('Failed to parse AI response as JSON');
            }

            // Fallback: extract recommendations from text
            return response
                .split(/\d+\.\s+/)
                .filter(line => line.trim().length > 10)
                .map(line => ({
                    tip: line.trim(),
                    example: ''
                }));
        } catch (error) {
            console.error('Error getting AI recommendations:', error);
            return [];
        }
    }

    /**
     * Analyze tone markers in text
     * @private
     */
    _analyzeToneMarkers(text) {
        const lowerText = text.toLowerCase();

        // Define tone vocabulary
        const toneVocab = {
            formal: ['furthermore', 'consequently', 'therefore', 'thus', 'nevertheless', 'however'],
            casual: ['anyway', 'basically', 'actually', 'like', 'so', 'pretty', 'stuff', 'things'],
            professional: ['accordingly', 'consider', 'demonstrate', 'implement', 'indicate', 'regarding'],
            academic: ['analyze', 'concept', 'data', 'evidence', 'hypothesis', 'methodology', 'theory'],
            persuasive: ['should', 'must', 'need', 'crucial', 'important', 'essential', 'significant'],
            conversational: ['think', 'feel', 'guess', 'maybe', 'probably', 'perhaps', 'seems like']
        };

        // Count occurrences
        const counts = {};
        Object.entries(toneVocab).forEach(([tone, words]) => {
            counts[tone] = 0;
            words.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) counts[tone] += matches.length;
            });
        });

        // Determine dominant tone
        const totalMarkers = Object.values(counts).reduce((sum, count) => sum + count, 0);

        if (totalMarkers === 0) {
            return {
                dominant: 'neutral',
                markers: counts,
                confidence: 0
            };
        }

        // Sort tones by count
        const sortedTones = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        const dominant = sortedTones[0][0];
        const confidence = (sortedTones[0][1] / totalMarkers) * 100;

        return {
            dominant,
            secondary: sortedTones[1][0],
            markers: counts,
            confidence: confidence.toFixed(1)
        };
    }

    /**
     * Assess formality level of text
     * @private
     */
    _assessFormality(text) {
        // Formality indicators
        const formalIndicators = {
            passiveVoice: (text.match(this.patterns.passiveVoice) || []).length,
            noContractions: text.match(/n't|'ve|'re|'ll|'d|'m/g) === null,
            complexWords: (text.match(this.patterns.complexWords) || []).length,
            firstPerson: (text.match(/\b(?:I|me|my|mine|we|us|our)\b/gi) || []).length === 0
        };

        // Casual indicators
        const casualIndicators = {
            contractions: (text.match(/n't|'ve|'re|'ll|'d|'m/g) || []).length,
            slang: (text.match(/\b(?:cool|awesome|guy|stuff|things|kind of|sort of)\b/gi) || []).length,
            exclamations: (text.match(/!/g) || []).length,
            firstPersonSingular: (text.match(/\bI\b/g) || []).length
        };

        // Calculate formality score (0-100)
        let formalityScore = 50; // Start neutral

        // Add points for formal indicators
        formalityScore += formalIndicators.passiveVoice * 2;
        formalityScore += formalIndicators.noContractions ? 10 : 0;
        formalityScore += formalIndicators.complexWords * 5;
        formalityScore += formalIndicators.firstPerson ? 15 : 0;

        // Subtract points for casual indicators
        formalityScore -= casualIndicators.contractions * 2;
        formalityScore -= casualIndicators.slang * 5;
        formalityScore -= casualIndicators.exclamations * 3;
        formalityScore -= casualIndicators.firstPersonSingular * 3;

        // Normalize to 0-100
        formalityScore = Math.max(0, Math.min(100, formalityScore));

        return {
            score: formalityScore,
            level: this._getFormalityLevel(formalityScore),
            indicators: {
                formal: formalIndicators,
                casual: casualIndicators
            }
        };
    }

    /**
     * Get formality level description
     * @private
     */
    _getFormalityLevel(score) {
        if (score >= 80) return 'Very Formal';
        if (score >= 60) return 'Formal';
        if (score >= 40) return 'Neutral';
        if (score >= 20) return 'Casual';
        return 'Very Casual';
    }

    /**
     * Calculate sentiment score of text
     * @private
     */
    _calculateSentiment(text) {
        // Simple sentiment analysis
        const positive = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'happy', 'glad', 'positive', 'success', 'benefit', 'love', 'impressive'
        ];

        const negative = [
            'bad', 'poor', 'terrible', 'awful', 'horrible', 'disappointing',
            'sad', 'upset', 'negative', 'failure', 'problem', 'hate', 'difficult'
        ];

        let positiveCount = 0;
        let negativeCount = 0;

        // Count positive and negative words
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
            if (positive.includes(word)) positiveCount++;
            if (negative.includes(word)) negativeCount++;
        });

        // Calculate sentiment score (-1 to 1)
        const total = positiveCount + negativeCount;
        let score = 0;

        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
        }

        return {
            score: parseFloat(score.toFixed(2)),
            positive: positiveCount,
            negative: negativeCount,
            classification: this._getSentimentClassification(score)
        };
    }

    /**
     * Get sentiment classification
     * @private
     */
    _getSentimentClassification(score) {
        if (score >= 0.5) return 'Very Positive';
        if (score >= 0.1) return 'Positive';
        if (score > -0.1) return 'Neutral';
        if (score > -0.5) return 'Negative';
        return 'Very Negative';
    }

    /**
     * Get AI-based tone analysis
     * @private
     */
    async _getAIToneAnalysis(text) {
        try {
            // Sample text to keep within token limits
            const sampleText = text.length > 1200 ? text.substring(0, 1200) + '...' : text;

            const prompt = `
Analyze the tone of the following text. Consider aspects like:
- Formality level
- Emotional tone (positive, negative, neutral)
- Purpose (persuasive, informative, narrative, etc.)
- Stylistic elements

Provide your analysis in JSON format with these properties:
- overallTone: description of the overall tone
- formality: level of formality (very formal, formal, neutral, casual, very casual)
- emotion: primary emotional tone
- purpose: apparent purpose of the text
- audience: likely intended audience
- stylistic: key stylistic elements observed

TEXT TO ANALYZE:
${sampleText}
`;

            const response = await this.modelManager.generateText(prompt, {
                temperature: 0.3,
                detailed: true
            });

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('Failed to parse AI tone analysis as JSON');
            }

            // Return raw response as fallback
            return { analysis: response };
        } catch (error) {
            console.error('Error getting AI tone analysis:', error);
            return { error: 'Failed to analyze tone' };
        }
    }

    /**
     * Create document outline from headings
     * @private
     */
    _createOutline(headings, totalParagraphs) {
        if (headings.length === 0) {
            return {
                structure: 'No headings found',
                hierarchy: 'None',
                coverage: '0%'
            };
        }

        // Create hierarchy representation
        const hierarchy = headings.map(h => {
            return `${'  '.repeat(h.level - 1)}${h.level}. ${h.text.substring(0, 40)}${h.text.length > 40 ? '...' : ''}`;
        }).join('\n');

        // Calculate heading-to-paragraph ratio
        const coverage = (headings.length / Math.max(1, totalParagraphs) * 100).toFixed(1) + '%';

        // Determine structure type
        let structure = 'Standard';
        if (headings.length < 3) {
            structure = 'Minimal';
        } else if (headings.every(h => h.level === 1)) {
            structure = 'Flat';
        } else if (headings.some(h => h.level > 2)) {
            structure = 'Deep';
        }

        return {
            structure,
            hierarchy,
            coverage,
            headingCount: headings.length
        };
    }

    /**
     * Analyze balance of document structure
     * @private
     */
    _analyzeStructureBalance(headings, totalParagraphs) {
        if (headings.length === 0) {
            return {
                balanced: false,
                issues: ['No headings found']
            };
        }

        const issues = [];

        // Check heading levels (should not skip levels)
        const levels = headings.map(h => h.level);
        const maxLevel = Math.max(...levels);
        for (let i = 1; i <= maxLevel; i++) {
            if (!levels.includes(i)) {
                issues.push(`Skipped heading level ${i}`);
            }
        }

        // Check heading distribution
        if (headings.length < totalParagraphs / 20) {
            issues.push('Too few headings for document size');
        }

        // Check for very large sections
        const sectionSizes = [];
        for (let i = 0; i < headings.length - 1; i++) {
            sectionSizes.push(headings[i + 1].index - headings[i].index);
        }
        // Add last section
        if (headings.length > 0) {
            sectionSizes.push(totalParagraphs - headings[headings.length - 1].index);
        }

        const avgSectionSize = sectionSizes.reduce((sum, size) => sum + size, 0) / sectionSizes.length;
        const largeThreshold = avgSectionSize * 2;

        sectionSizes.forEach((size, index) => {
            if (size > largeThreshold && size > 10) {
                issues.push(`Section starting with "${headings[index].text.substring(0, 30)}..." is unusually large`);
            }
        });

        return {
            balanced: issues.length === 0,
            issues: issues.length > 0 ? issues : ['Structure appears well-balanced'],
            averageSectionSize: Math.round(avgSectionSize)
        };
    }

    /**
     * Get AI recommendations for document structure
     * @private
     */
    async _getAIStructureRecommendations(outline, structureBalance) {
        try {
            // Only get recommendations if there are issues
            if (structureBalance.balanced) {
                return [{ tip: 'Document structure appears well-balanced.' }];
            }

            const prompt = `
Provide recommendations to improve document structure based on this analysis:

OUTLINE:
${outline.hierarchy}

STRUCTURE ISSUES:
${structureBalance.issues.join('\n')}

STATISTICS:
- Headings: ${outline.headingCount}
- Structure type: ${outline.structure}
- Coverage: ${outline.coverage}
- Average section size: ${structureBalance.averageSectionSize} paragraphs

Provide 2-4 specific recommendations to improve the document's structure.
Format as a JSON array of objects with 'tip' and 'rationale' properties.
`;

            const response = await this.modelManager.generateText(prompt, {
                temperature: 0.3,
                detailed: false
            });

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('Failed to parse structure recommendations as JSON');
            }

            // Fallback
            return [{
                tip: 'Consider adding more headings to better organize your content.',
                rationale: 'Well-structured documents use headings to create clear section boundaries.'
            }];
        } catch (error) {
            console.error('Error getting structure recommendations:', error);
            return [];
        }
    }
}

// Create and export singleton instance
const documentAnalyzer = new DocumentAnalyzer();
export default documentAnalyzer;
