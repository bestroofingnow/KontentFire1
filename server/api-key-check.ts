/**
 * API Key Check Utility
 * 
 * This file provides functionality to validate API keys and check service connectivity
 */

import { Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export async function validateOpenAIKey(req: Request, res: Response) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      service: 'openai',
      error: 'API key not found in environment',
      message: 'Please provide an OpenAI API key in the environment variables'
    });
  }
  
  try {
    const openai = new OpenAI({ apiKey });
    
    // Simple test call to validate the key
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello, this is a test message to validate the API key.' }],
      max_tokens: 5
    });
    
    return res.status(200).json({
      success: true,
      service: 'openai',
      message: 'OpenAI API key is valid',
      model: 'gpt-4o',
      response_sample: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API key validation error:', error);
    
    return res.status(400).json({
      success: false,
      service: 'openai',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'OpenAI API key validation failed'
    });
  }
}

export async function validateAnthropicKey(req: Request, res: Response) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      service: 'anthropic',
      error: 'API key not found in environment',
      message: 'Please provide an Anthropic API key in the environment variables'
    });
  }
  
  try {
    const anthropic = new Anthropic({ apiKey });
    
    // Simple test call to validate the key - the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Hello, this is a test message to validate the API key.' }]
    });
    
    return res.status(200).json({
      success: true,
      service: 'anthropic',
      message: 'Anthropic API key is valid',
      model: 'claude-3-7-sonnet-20250219',
      response_sample: response.content[0].text
    });
  } catch (error) {
    console.error('Anthropic API key validation error:', error);
    
    return res.status(400).json({
      success: false,
      service: 'anthropic',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Anthropic API key validation failed'
    });
  }
}

export async function validatePerplexityKey(req: Request, res: Response) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      service: 'perplexity',
      error: 'API key not found in environment',
      message: 'Please provide a Perplexity API key in the environment variables'
    });
  }
  
  try {
    // Direct API call to validate the key
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'Be concise.' },
          { role: 'user', content: 'Hello, this is a test message to validate the API key.' }
        ],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      service: 'perplexity',
      message: 'Perplexity API key is valid',
      model: 'llama-3.1-sonar-small-128k-online',
      response_sample: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Perplexity API key validation error:', error);
    
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(400).json({
      success: false,
      service: 'perplexity',
      error: errorMessage,
      message: 'Perplexity API key validation failed'
    });
  }
}

export async function validateAllAPIKeys(req: Request, res: Response) {
  const results = {
    openai: null,
    anthropic: null,
    perplexity: null
  };
  
  // Check OpenAI
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      results.openai = { 
        success: false, 
        error: 'API key not found in environment' 
      };
    } else {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
      
      results.openai = { 
        success: true, 
        model: 'gpt-4o',
        sample: response.choices[0].message.content
      };
    }
  } catch (error) {
    results.openai = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
  
  // Check Anthropic
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      results.anthropic = { 
        success: false, 
        error: 'API key not found in environment' 
      };
    } else {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test' }]
      });
      
      results.anthropic = { 
        success: true, 
        model: 'claude-3-7-sonnet-20250219',
        sample: response.content[0].text
      };
    }
  } catch (error) {
    results.anthropic = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
  
  // Check Perplexity
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      results.perplexity = { 
        success: false, 
        error: 'API key not found in environment' 
      };
    } else {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: 'Be concise.' },
            { role: 'user', content: 'Test' }
          ],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      results.perplexity = { 
        success: true, 
        model: 'llama-3.1-sonar-small-128k-online',
        sample: response.data.choices[0].message.content
      };
    }
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    results.perplexity = { 
      success: false, 
      error: errorMessage
    };
  }
  
  return res.status(200).json({
    results,
    summary: {
      all_working: results.openai?.success && results.anthropic?.success && results.perplexity?.success,
      working_services: [
        results.openai?.success ? 'openai' : null,
        results.anthropic?.success ? 'anthropic' : null,
        results.perplexity?.success ? 'perplexity' : null
      ].filter(Boolean)
    }
  });
}