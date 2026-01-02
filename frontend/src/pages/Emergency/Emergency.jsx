import { useEffect, useState } from "react"
import axios from "axios"
import "./Emergency.css"

function Emergency() {
  const [showContactsPage, setShowContactsPage] = useState(false)

  // Replace with your actual emergency number or fetch it from backend
  const emergencyNumber = "0498158685"

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

  const handleEmergencyCall = () => {
    // Opens dialer immediately
    window.location.href = `tel:${emergencyNumber}`
  }

  const handleContactCall = (number) => {
    window.location.href = `tel:${number}`
  }

  if (showContactsPage) {
    return (
      <div className="emergency-contacts-page">
        {/* Back button */}
        <button
          onClick={() => setShowContactsPage(false)}
          className="emergency-back-button"
        >
          ← Back
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
      {/* Copied Back button */}
      <button
        onClick={() => (window.location.href = "/map")}
        style={{
          position: "absolute",        // makes it float on the screen
          top: "20px",                 // distance from top
          left: "20px",               // distance from right
          backgroundColor: "beige",    // beige background
          border: "2px solid grey",    // grey border
          color: "black",              // text color
          padding: "8px 16px",
          borderRadius: "20px",
          cursor: "pointer",
          fontWeight: "bold",
          zIndex: 1000                 // ensure it stays above the map
        }}
      >
        ← Back
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
              Emergency Contacts
            </div>
            <div className="emergency-bottom-card-number">
              {emergencyNumber}
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
    </div>
  )
}

export default Emergency;