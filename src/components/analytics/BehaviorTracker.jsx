import { useEffect } from 'react';

// Event tracking for behavioral analytics
const trackEvent = async (eventName, properties = {}) => {
  try {
    // Create analytical event record
    const eventData = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      properties: JSON.stringify(properties),
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      session_id: sessionStorage.getItem('sessionId') || 'anonymous'
    };

    // In a real implementation, you'd send this to an analytics service
    console.log('📊 Event tracked:', eventData);
    
    // Store locally for admin dashboard
    const existingEvents = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    existingEvents.push(eventData);
    
    // Keep only last 100 events locally
    if (existingEvents.length > 100) {
      existingEvents.shift();
    }
    
    localStorage.setItem('analyticsEvents', JSON.stringify(existingEvents));
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Page view tracker
export const usePageView = (pageName) => {
  useEffect(() => {
    const startTime = Date.now();
    
    trackEvent('page_view', {
      page_name: pageName,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    // Track time spent on page
    return () => {
      const timeSpent = Date.now() - startTime;
      trackEvent('page_exit', {
        page_name: pageName,
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000)
      });
    };
  }, [pageName]);
};

// Button click tracker
export const useClickTracking = () => {
  return (buttonName, additionalProperties = {}) => {
    trackEvent('button_click', {
      button_name: buttonName,
      ...additionalProperties
    });
  };
};

// Form interaction tracker
export const useFormTracking = () => {
  return {
    trackFormStart: (formName) => {
      trackEvent('form_started', { form_name: formName });
    },
    trackFormField: (formName, fieldName, value) => {
      trackEvent('form_field_interaction', {
        form_name: formName,
        field_name: fieldName,
        field_value: typeof value === 'string' ? value.substring(0, 100) : value // Truncate for privacy
      });
    },
    trackFormSubmit: (formName, success = true, errorMessage = null) => {
      trackEvent('form_submitted', {
        form_name: formName,
        success,
        error_message: errorMessage
      });
    },
    trackFormAbandon: (formName, lastField) => {
      trackEvent('form_abandoned', {
        form_name: formName,
        last_field: lastField
      });
    }
  };
};

// Search and filtering tracker
export const useSearchTracking = () => {
  return {
    trackSearch: (query, resultsCount) => {
      trackEvent('search_performed', {
        query: query.substring(0, 200), // Truncate for privacy
        results_count: resultsCount
      });
    },
    trackFilterApplied: (filterType, filterValue) => {
      trackEvent('filter_applied', {
        filter_type: filterType,
        filter_value: filterValue
      });
    },
    trackSearchResult: (query, clickedResult, position) => {
      trackEvent('search_result_clicked', {
        query: query.substring(0, 200),
        clicked_result: clickedResult,
        position
      });
    }
  };
};

// Conversion funnel tracker
export const useConversionTracking = () => {
  return {
    trackFunnelStep: (stepName, stepNumber, sessionId) => {
      trackEvent('funnel_step', {
        step_name: stepName,
        step_number: stepNumber,
        session_id: sessionId
      });
    },
    trackConversion: (sessionId, conversionValue, conversionType) => {
      trackEvent('conversion', {
        session_id: sessionId,
        conversion_value: conversionValue,
        conversion_type: conversionType
      });
    },
    trackDropoff: (stepName, stepNumber, sessionId, reason) => {
      trackEvent('funnel_dropoff', {
        step_name: stepName,
        step_number: stepNumber,
        session_id: sessionId,
        dropoff_reason: reason
      });
    }
  };
};

// Error tracking
export const useErrorTracking = () => {
  return (errorType, errorMessage, context = {}) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: JSON.stringify(context),
      stack_trace: new Error().stack?.substring(0, 500) // Truncated stack trace
    });
  };
};

// Export the main tracking function for custom events
export { trackEvent };

// Default export for easy import
export default function BehaviorTracker({ children }) {
  return children;
}