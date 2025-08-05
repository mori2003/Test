#!/usr/bin/env python3
"""
Advanced Data Analysis Example
==============================

This module demonstrates sophisticated data analysis capabilities including:
- Data loading and preprocessing
- Statistical analysis and visualization
- Machine learning model implementation
- Performance optimization techniques
- Error handling and logging

Author: AI Agent
Date: 2024
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import logging
from typing import Tuple, Dict, Any
import warnings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class DataAnalyzer:
    """
    A comprehensive data analysis class demonstrating various AI capabilities.
    """
    
    def __init__(self, random_state: int = 42):
        """Initialize the analyzer with configuration."""
        self.random_state = random_state
        self.data = None
        self.model = None
        self.scaler = StandardScaler()
        
        # Set style for visualizations
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
    def generate_sample_data(self, n_samples: int = 1000) -> pd.DataFrame:
        """
        Generate realistic sample dataset for demonstration.
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            Generated DataFrame with multiple features
        """
        logger.info(f"Generating {n_samples} sample data points...")
        
        np.random.seed(self.random_state)
        
        # Generate correlated features
        base_feature = np.random.randn(n_samples)
        
        data = {
            'feature_1': base_feature + np.random.randn(n_samples) * 0.5,
            'feature_2': base_feature * 1.2 + np.random.randn(n_samples) * 0.3,
            'feature_3': np.random.exponential(2, n_samples),
            'feature_4': np.random.uniform(0, 100, n_samples),
            'category': np.random.choice(['A', 'B', 'C'], n_samples, p=[0.5, 0.3, 0.2]),
            'timestamp': pd.date_range('2023-01-01', periods=n_samples, freq='H')
        }
        
        # Create target variable with some logic
        target_prob = (
            0.3 * (data['feature_1'] > 0) +
            0.2 * (data['feature_2'] > 1) +
            0.1 * (data['feature_3'] > 2) +
            0.4 * np.random.random(n_samples)
        )
        
        data['target'] = (target_prob > 0.5).astype(int)
        
        self.data = pd.DataFrame(data)
        logger.info("Sample data generated successfully!")
        return self.data
    
    def exploratory_data_analysis(self) -> Dict[str, Any]:
        """
        Perform comprehensive exploratory data analysis.
        
        Returns:
            Dictionary containing analysis results
        """
        if self.data is None:
            raise ValueError("No data available. Please load or generate data first.")
        
        logger.info("Performing exploratory data analysis...")
        
        # Basic statistics
        stats = {
            'shape': self.data.shape,
            'dtypes': self.data.dtypes.to_dict(),
            'missing_values': self.data.isnull().sum().to_dict(),
            'numeric_summary': self.data.describe().to_dict()
        }
        
        # Correlation analysis
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns
        correlation_matrix = self.data[numeric_columns].corr()
        
        # Create visualizations
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Exploratory Data Analysis', fontsize=16, fontweight='bold')
        
        # Distribution plots
        self.data['feature_1'].hist(bins=30, ax=axes[0, 0], alpha=0.7)
        axes[0, 0].set_title('Feature 1 Distribution')
        axes[0, 0].set_xlabel('Value')
        axes[0, 0].set_ylabel('Frequency')
        
        # Correlation heatmap
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', 
                   center=0, ax=axes[0, 1])
        axes[0, 1].set_title('Feature Correlation Matrix')
        
        # Category distribution
        category_counts = self.data['category'].value_counts()
        axes[1, 0].pie(category_counts.values, labels=category_counts.index, 
                      autopct='%1.1f%%')
        axes[1, 0].set_title('Category Distribution')
        
        # Target vs Feature relationship
        for target_val in [0, 1]:
            subset = self.data[self.data['target'] == target_val]
            axes[1, 1].scatter(subset['feature_1'], subset['feature_2'], 
                             alpha=0.6, label=f'Target {target_val}')
        axes[1, 1].set_xlabel('Feature 1')
        axes[1, 1].set_ylabel('Feature 2')
        axes[1, 1].set_title('Feature Relationship by Target')
        axes[1, 1].legend()
        
        plt.tight_layout()
        plt.savefig('/workspace/examples/python/eda_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        stats['correlation_matrix'] = correlation_matrix.to_dict()
        logger.info("EDA completed successfully!")
        return stats
    
    def build_predictive_model(self) -> Dict[str, Any]:
        """
        Build and evaluate a machine learning model.
        
        Returns:
            Model performance metrics
        """
        if self.data is None:
            raise ValueError("No data available. Please load or generate data first.")
        
        logger.info("Building predictive model...")
        
        # Prepare features
        feature_columns = ['feature_1', 'feature_2', 'feature_3', 'feature_4']
        X = self.data[feature_columns]
        y = self.data['target']
        
        # Add categorical encoding
        category_dummies = pd.get_dummies(self.data['category'], prefix='category')
        X = pd.concat([X, category_dummies], axis=1)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.random_state, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=self.random_state,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        results = {
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'feature_importance': dict(zip(X.columns, self.model.feature_importances_)),
            'train_score': self.model.score(X_train_scaled, y_train),
            'test_score': self.model.score(X_test_scaled, y_test)
        }
        
        # Visualize results
        fig, axes = plt.subplots(1, 2, figsize=(12, 5))
        
        # Feature importance
        importance_df = pd.DataFrame({
            'feature': X.columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=True)
        
        axes[0].barh(importance_df['feature'], importance_df['importance'])
        axes[0].set_title('Feature Importance')
        axes[0].set_xlabel('Importance Score')
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1])
        axes[1].set_title('Confusion Matrix')
        axes[1].set_xlabel('Predicted')
        axes[1].set_ylabel('Actual')
        
        plt.tight_layout()
        plt.savefig('/workspace/examples/python/model_results.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        logger.info(f"Model trained successfully! Test accuracy: {results['test_score']:.3f}")
        return results
    
    def time_series_analysis(self) -> Dict[str, Any]:
        """
        Demonstrate time series analysis capabilities.
        
        Returns:
            Time series analysis results
        """
        if self.data is None:
            raise ValueError("No data available. Please load or generate data first.")
        
        logger.info("Performing time series analysis...")
        
        # Aggregate data by day
        daily_data = self.data.set_index('timestamp').resample('D').agg({
            'feature_1': 'mean',
            'feature_2': 'mean',
            'target': 'sum'
        })
        
        # Calculate rolling statistics
        daily_data['feature_1_ma7'] = daily_data['feature_1'].rolling(window=7).mean()
        daily_data['feature_1_std7'] = daily_data['feature_1'].rolling(window=7).std()
        
        # Create time series visualization
        fig, axes = plt.subplots(2, 1, figsize=(12, 8))
        
        # Feature trends
        axes[0].plot(daily_data.index, daily_data['feature_1'], 
                    label='Feature 1', alpha=0.7)
        axes[0].plot(daily_data.index, daily_data['feature_1_ma7'], 
                    label='7-day MA', linewidth=2)
        axes[0].fill_between(daily_data.index, 
                           daily_data['feature_1_ma7'] - daily_data['feature_1_std7'],
                           daily_data['feature_1_ma7'] + daily_data['feature_1_std7'],
                           alpha=0.3, label='±1 Std Dev')
        axes[0].set_title('Feature 1 Time Series with Moving Average')
        axes[0].set_ylabel('Value')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Target distribution over time
        axes[1].bar(daily_data.index, daily_data['target'], alpha=0.7, color='orange')
        axes[1].set_title('Daily Target Count')
        axes[1].set_xlabel('Date')
        axes[1].set_ylabel('Count')
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('/workspace/examples/python/time_series_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        results = {
            'daily_stats': daily_data.describe().to_dict(),
            'trend_analysis': {
                'mean_feature_1': daily_data['feature_1'].mean(),
                'std_feature_1': daily_data['feature_1'].std(),
                'total_targets': daily_data['target'].sum()
            }
        }
        
        logger.info("Time series analysis completed!")
        return results

def main():
    """
    Main function demonstrating the complete analysis workflow.
    """
    print("🤖 AI Agent Data Analysis Showcase")
    print("=" * 50)
    
    # Initialize analyzer
    analyzer = DataAnalyzer()
    
    try:
        # Generate sample data
        print("\n1. Generating sample data...")
        data = analyzer.generate_sample_data(n_samples=2000)
        print(f"   ✓ Generated {len(data)} samples with {len(data.columns)} features")
        
        # Perform EDA
        print("\n2. Performing exploratory data analysis...")
        eda_results = analyzer.exploratory_data_analysis()
        print(f"   ✓ Data shape: {eda_results['shape']}")
        print(f"   ✓ Missing values: {sum(eda_results['missing_values'].values())}")
        
        # Build predictive model
        print("\n3. Building predictive model...")
        model_results = analyzer.build_predictive_model()
        print(f"   ✓ Model accuracy: {model_results['test_score']:.3f}")
        print(f"   ✓ Top feature: {max(model_results['feature_importance'], key=model_results['feature_importance'].get)}")
        
        # Time series analysis
        print("\n4. Performing time series analysis...")
        ts_results = analyzer.time_series_analysis()
        print(f"   ✓ Daily trend analysis completed")
        
        print("\n🎉 Analysis completed successfully!")
        print("   📊 Visualizations saved as PNG files")
        print("   📈 Check the generated plots for insights")
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    main()