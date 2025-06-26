"""
Prompt Manager for TCC Log AI System
Handles loading and formatting of prompt templates from JSON files
"""
import json
import os
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

class PromptManager:
    """Manages AI prompts loaded from JSON configuration files"""
    
    def __init__(self, prompts_file: str = None):
        self.prompts_file = prompts_file or os.path.join(
            os.path.dirname(__file__), 
            "prompts.json"
        )
        self.prompts = {}
        self.load_prompts()
    
    def load_prompts(self) -> None:
        """Load prompts from JSON file"""
        try:
            if os.path.exists(self.prompts_file):
                with open(self.prompts_file, 'r', encoding='utf-8') as f:
                    self.prompts = json.load(f)
                logger.info(f"Loaded prompts from {self.prompts_file}")
            else:
                logger.warning(f"Prompts file not found: {self.prompts_file}")
                self.prompts = self._get_default_prompts()
        except Exception as e:
            logger.error(f"Error loading prompts from {self.prompts_file}: {e}")
            self.prompts = self._get_default_prompts()
    
    def reload_prompts(self) -> None:
        """Reload prompts from file (useful for development)"""
        self.load_prompts()
    
    def get_system_prompt(self, prompt_type: str = "default_chat") -> str:
        """Get a system prompt by type"""
        try:
            return self.prompts.get("system_prompts", {}).get(prompt_type, "")
        except Exception as e:
            logger.error(f"Error getting system prompt '{prompt_type}': {e}")
            return "You are a helpful AI assistant."
    
    def get_sql_prompt(self, schema_text: str = "") -> str:
        """Generate SQL prompt with schema information"""
        try:
            sql_config = self.prompts.get("system_prompts", {}).get("sql_agent", {})
            
            # Handle empty schema
            if not schema_text or schema_text.strip() == "":
                dummy_config = self.prompts.get("dummy_schema", {})
                schema_text = (
                    f"{dummy_config.get('description', 'No tables found.')}\n\n"
                    f"Example table creation:\n{dummy_config.get('example_create', '')}\n\n"
                    f"Example data insertion:\n{dummy_config.get('example_insert', '')}"
                )
            
            # Escape curly braces in schema_text
            safe_schema_text = schema_text.replace("{", "{{").replace("}", "}}")
            
            # Build the SQL prompt
            prompt_parts = [
                sql_config.get("intro", "").format(schema_text=safe_schema_text),
                sql_config.get("workflow", ""),
                sql_config.get("format", ""),
                self._build_examples_section(sql_config.get("examples", [])),
                self._build_prohibited_section(sql_config.get("prohibited_behaviors", [])),
                self._build_best_practices_section(sql_config.get("best_practices", {})),
                self._build_guidelines_section(sql_config.get("parsing_guidelines", [])),
                self._build_remember_section(sql_config.get("remember", []))
            ]
            
            return "".join(prompt_parts)
            
        except Exception as e:
            logger.error(f"Error building SQL prompt: {e}")
            return "\n\nDatabase access available but prompt configuration error."
    
    def get_analysis_prompt(self, analysis_type: str = "general") -> str:
        """Get analysis prompt for journal entries"""
        try:
            analysis_prompts = self.prompts.get("system_prompts", {}).get("analysis_prompts", {})
            return analysis_prompts.get(analysis_type, analysis_prompts.get("general", ""))
        except Exception as e:
            logger.error(f"Error getting analysis prompt '{analysis_type}': {e}")
            return "Analyze this content and provide insights."
    
    def get_writing_improvement_prompt(self, improvement_type: str = "complete") -> str:
        """Get writing improvement prompt"""
        try:
            writing_prompts = self.prompts.get("system_prompts", {}).get("writing_improvement", {})
            return writing_prompts.get(improvement_type, writing_prompts.get("complete", ""))
        except Exception as e:
            logger.error(f"Error getting writing improvement prompt '{improvement_type}': {e}")
            return "Improve this text for better clarity and correctness."
    
    def _build_examples_section(self, examples: List[Dict]) -> str:
        """Build examples section from JSON configuration"""
        if not examples:
            return ""
        
        section = "\n\n### EXAMPLES:\n\n"
        
        for i, example in enumerate(examples, 1):
            section += f"**Example {i} - {example.get('title', 'Query')}:**\n\n"
            section += f"### QUERY_INTENT: {example.get('query_intent', '')}\n"
            section += f"SQL_NEEDED: {example.get('sql_needed', 'yes')}\n\n"
            section += f"```\n{example.get('sql', '')}\n```\n\n"
            section += f"EXPECTED_RESULT: {example.get('expected_result', '')}\n\n"
            section += f"EXPLANATION: {example.get('explanation', '')}\n\n"
        
        return section
    
    def _build_prohibited_section(self, prohibited: List[str]) -> str:
        """Build prohibited behaviors section"""
        if not prohibited:
            return ""
        
        section = "\n### PROHIBITED BEHAVIORS:\n\n"
        for behavior in prohibited:
            section += f"❌ **{behavior}**\n\n"
        
        return section
    
    def _build_best_practices_section(self, practices: Dict[str, List[str]]) -> str:
        """Build best practices section"""
        if not practices:
            return ""
        
        section = "\n### SQL BEST PRACTICES:\n\n"
        
        for category, items in practices.items():
            section += f"{category.replace('_', ' ').title()}:\n"
            for item in items:
                section += f"   - {item}\n"
            section += "\n"
        
        return section
    
    def _build_guidelines_section(self, guidelines: List[str]) -> str:
        """Build parsing guidelines section"""
        if not guidelines:
            return ""
        
        section = "\n### PARSING GUIDELINES:\n\n"
        for i, guideline in enumerate(guidelines, 1):
            section += f"{i}. **{guideline}**\n"
        
        return section
    
    def _build_remember_section(self, remember_items: List[str]) -> str:
        """Build remember section"""
        if not remember_items:
            return ""
        
        section = "\n### REMEMBER:\n"
        for item in remember_items:
            section += f"- {item}\n"
        
        return section
    
    def _get_default_prompts(self) -> Dict[str, Any]:
        """Fallback prompts if JSON file is not available"""
        return {
            "system_prompts": {
                "default_chat": "You are a helpful AI assistant. Be friendly and conversational."
            },
            "metadata": {
                "version": "fallback",
                "description": "Default fallback prompts"
            }
        }
    
    def save_prompts(self, prompts: Dict[str, Any] = None) -> bool:
        """Save prompts to JSON file"""
        try:
            prompts_to_save = prompts or self.prompts
            with open(self.prompts_file, 'w', encoding='utf-8') as f:
                json.dump(prompts_to_save, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved prompts to {self.prompts_file}")
            return True
        except Exception as e:
            logger.error(f"Error saving prompts: {e}")
            return False
    
    def update_prompt(self, category: str, key: str, value: str) -> bool:
        """Update a specific prompt and save to file"""
        try:
            if category not in self.prompts:
                self.prompts[category] = {}
            
            self.prompts[category][key] = value
            return self.save_prompts()
        except Exception as e:
            logger.error(f"Error updating prompt {category}.{key}: {e}")
            return False
    
    def list_available_prompts(self) -> Dict[str, List[str]]:
        """List all available prompt categories and keys"""
        result = {}
        for category, prompts in self.prompts.items():
            if isinstance(prompts, dict):
                result[category] = list(prompts.keys())
        return result

# Global instance
_prompt_manager = None

def get_prompt_manager() -> PromptManager:
    """Get global prompt manager instance"""
    global _prompt_manager
    if _prompt_manager is None:
        _prompt_manager = PromptManager()
    return _prompt_manager

# Convenience functions
def get_system_prompt(prompt_type: str = "default_chat") -> str:
    """Get system prompt by type"""
    return get_prompt_manager().get_system_prompt(prompt_type)

def get_sql_prompt(schema_text: str = "") -> str:
    """Get SQL prompt with schema"""
    return get_prompt_manager().get_sql_prompt(schema_text)

def get_analysis_prompt(analysis_type: str = "general") -> str:
    """Get analysis prompt"""
    return get_prompt_manager().get_analysis_prompt(analysis_type)

def get_writing_improvement_prompt(improvement_type: str = "complete") -> str:
    """Get writing improvement prompt"""
    return get_prompt_manager().get_writing_improvement_prompt(improvement_type)

def reload_prompts() -> None:
    """Reload prompts from file"""
    get_prompt_manager().reload_prompts()
