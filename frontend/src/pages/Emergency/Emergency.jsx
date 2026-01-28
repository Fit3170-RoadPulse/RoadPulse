import { useEffect, useState } from "react"
import { X, AlertCircle } from "lucide-react"
import "./Emergency.css"
import { fetchEmergencyContact } from "../../lib/api"

function Emergency() {
  const [showContactsPage, setShowContactsPage] = useState(false)
  const [emergencyNumber, setEmergencyNumber] = useState("")
  const [emergencyName, setEmergencyName] = useState("") // contact name or ""

  useEffect(() => {
    async function loadContact() {
        try {
            const contact = await fetchEmergencyContact();
            if (contact && contact.phone_number) {
                setEmergencyNumber(contact.phone_number);
                if (contact.name) {
                    setEmergencyName(contact.name);
                }
            }
        } catch (err) {
            console.error("Failed to load emergency contact", err);
        }
    }
    loadContact();
  }, []);

  // Emergency contacts data
  const emergencyContacts = [
    {
      category: "Emergency - Dial Immediately",
      contacts: [
        { name: "Emergency Services:", number: "000" },
        { name: "Police Emergency:", number: "000" },
        { name: "VicRoads Emergency:", number: "13 11 70" }
      ]
    },
    {
      category: "Clayton Emergency Services",
      contacts: [
        { name: "Victoria Police - Monash:", number: "(03) 9558 5555" },
        { name: "CFA Clayton Fire Brigade:", number: "(03) 9544 8891" },
        { name: "Monash City Council:", number: "(03) 9518 3555" }
      ]
    },
    {
      category: "VicRoads & Highway Services",
      contacts: [
        { name: "Princes Highway:", number: "(03) 9854 2666" },
        { name: "Traffic Incident Response:", number: "(03) 9854 2666" },
        { name: "VicRoads Traffic Control:", number: "13 11 70" }
      ]
    },
    {
      category: "Roadside Assistance & Towing",
      contacts: [
        { name: "Clayton Towing Services:", number: "(03) 9544 7799" },
        { name: "Princes Highway Towing:", number: "(03) 9793 1234" },
        { name: "24/7 Metro Towing:", number: "(03) 9328 3000" }
      ]
    }
  ]

  const safetyTips = [
    "Pull completely off the roadway when safe to do so",
    "Turn on hazard lights and use warning triangles",
    "Stay in your vehicle if on busy roads like Princes Highway",
    "For roadside assistance, call RACV on 13 11 11",
    "Always call 000 for life-threatening emergencies"
  ]

  /* Error Modal State */
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleEmergencyCall = () => {
    // Check if we have a valid emergency contact loaded.
    // If no number is set, we assume no contact is configured.
    if (!emergencyNumber) {
        setErrorMessage("You haven't set an emergency contact yet.\nPlease go to your Settings to set one up.");
        setShowErrorModal(true);
        return;
    }

    // Opens dialer immediately
    window.location.href = `tel:${emergencyNumber}`
  }

  const handleContactCall = (number) => {
    window.location.href = `tel:${number}`
  }

  if (showContactsPage) {
    return (
      <div className="emergency-contacts-page">
        {/* Close button */}
        <button
          onClick={() => setShowContactsPage(false)}
          className="emergency-close-btn"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Emergency contacts grid */}
        <div className="emergency-contacts-grid">
          {emergencyContacts.map((section, index) => (
            <div key={index} className="emergency-contact-card">
              <div className="emergency-category-header">
                <span className="emergency-category-icon">📞</span>
                {section.category}
              </div>
              {section.contacts.map((contact, contactIndex) => (
                <div key={contactIndex} className={`emergency-contact-row ${contactIndex < section.contacts.length - 1 ? 'emergency-contact-row-with-border' : ''}`}>
                  <span className="emergency-contact-name">
                    {contact.name}
                  </span>
                  <button
                    onClick={() => handleContactCall(contact.number)}
                    className="emergency-contact-number-button"
                  >
                    {contact.number}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Safety tips */}
        <div className="emergency-safety-tips">
          <div className="emergency-safety-tips-header">
            <span className="emergency-category-icon">ℹ️</span>
            Australian Highway Safety Tips
          </div>
          {safetyTips.map((tip, index) => (
            <div key={index} className="emergency-safety-tip">
              • {tip}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="emergency-main-page">
      {/* Close button */}
      <button
        onClick={() => (window.location.href = "/map")}
        className="emergency-close-btn"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Emergency Call Button */}
      <button
        className="emergency-call-button"
        onClick={handleEmergencyCall}
      >
        <div className="emergency-call-button-content">
          <div className="emergency-call-button-title">
            ⚠️ Emergency
          </div>
          <div className="emergency-call-button-subtitle">
            Press for help
          </div>
        </div>
      </button>

      {/* Emergency Contacts Rectangle at Bottom */}
      <div className="emergency-bottom-card">
        <div className="emergency-bottom-card-content">
          <div className="emergency-bottom-card-icon">
            📞
          </div>
            <div className="emergency-bottom-card-text">
              <div className="emergency-bottom-card-label">
                Emergency Contact
              </div>
              <div className="emergency-bottom-card-number">
                {emergencyNumber ? (
                  <>
                    {emergencyNumber} <span style={{fontWeight: 'normal', fontSize: '14px', color: '#666'}}>({emergencyName})</span>
                  </>
                ) : (
                  <span style={{color: '#999', fontStyle: 'italic', fontWeight: 'normal'}}>Not Set</span>
                )}
              </div>
            </div>
          <button
            onClick={() => setShowContactsPage(true)}
            className="emergency-view-all-button"
          >
            View All
          </button>
        </div>
      </div>
      {/* Error Modal */}
      {showErrorModal && (
        <div 
            className="error-modal-overlay"
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="error-modal-backdrop"
                onClick={() => setShowErrorModal(false)} 
            />
            <div className="error-modal-card">
                <div className="error-modal-header">
                    <div className="error-icon-circle">
                        <AlertCircle size={32} color="#ef4444" strokeWidth={2.5} />
                    </div>
                    <h3 className="error-card-title">
                        Action Required
                    </h3>
                </div>
                
                <div className="error-card-body">
                    <p className="error-message-text">
                        {errorMessage}
                    </p>
                </div>
                
                <div className="error-card-footer">
                    <button
                        onClick={() => setShowErrorModal(false)}
                        className="error-dismiss-btn"
                    >
                        Okay, I'll set it
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default Emergency;