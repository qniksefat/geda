import os
from typing import Optional, List, Dict, Any
from geda.parsers.base_parser import BaseParser
from geda.parsers.adapters.rbc_parser import RBCParser
from geda.parsers.adapters.cibc_parser import CIBCParser
from geda.parsers.adapters.generic_csv_parser import GenericCSVParser
from geda.parsers.pdf_parser import PDFParser

class ParserFactory:
    """Factory for creating parsers based on file type and source"""
    
    @staticmethod
    def get_parser(file_path: str) -> BaseParser:
        """
        Get the appropriate parser for a file.
        
        Args:
            file_path: Path to the file to parse
            
        Returns:
            An instance of a BaseParser subclass
            
        Raises:
            ValueError: If the file type is not supported
        """
        # Get file extension
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext == '.csv':
            # For CSV, we'll try to detect the source from the content
            return ParserFactory._get_csv_parser(file_path)
        elif ext == '.pdf':
            # For PDF, use the generic PDF parser which will detect the source
            return PDFParser()
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    @staticmethod
    def _get_csv_parser(file_path: str) -> BaseParser:
        """
        Get the appropriate CSV parser based on file content.
        
        Args:
            file_path: Path to the CSV file
            
        Returns:
            An instance of a BaseParser subclass for CSV files
        """
        # Read the first few lines to detect the format
        with open(file_path, 'r', encoding='utf-8') as f:
            header = ''.join([f.readline() for _ in range(5)])
        
        # Check for RBC patterns
        if "RBC" in header or "Royal Bank" in header:
            return RBCParser()
        # Check for CIBC patterns
        elif "CIBC" in header or "Canadian Imperial Bank of Commerce" in header:
            return CIBCParser()
        # Additional banks can be added here
        # elif "AMEX" in header or "American Express" in header:
        #     return AmexParser()
        else:
            # Default to trying different parsers
            try:
                # Try RBC first
                parser = RBCParser()
                transactions = parser.parse(file_path)
                if transactions:
                    return parser
            except Exception:
                pass
                
            try:
                # Try CIBC next
                parser = CIBCParser()
                transactions = parser.parse(file_path)
                if transactions:
                    return parser
            except Exception:
                pass
                
            try:
                # Try generic CSV parser as last resort
                parser = GenericCSVParser()
                transactions = parser.parse(file_path)
                if transactions:
                    return parser
            except Exception:
                pass
                
            # If we get here, we couldn't determine the source
            raise ValueError(f"Could not determine source for CSV file: {file_path}")