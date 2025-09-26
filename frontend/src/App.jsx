import { useEffect, useState } from "react"
import axios from "axios"

export default function App() {
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

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || ""
    axios.get(`${base}/api/health/`).then(r => setHealth(r.data))
    axios.get(`${base}/api/samples/`).then(r => setSamples(r.data))
  }, [])

  const handleEmergencyCall = () => {
    // Opens dialer immediately
    window.location.href = `tel:${emergencyNumber}`
  }

  const handleContactCall = (number) => {
    window.location.href = `tel:${number}`
  }

  if (showContactsPage) {
    return (
      <div style={{
        backgroundColor: "#ff9999",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial, sans-serif"
      }}>
        {/* Back button */}
        <button
          onClick={() => setShowContactsPage(false)}
          style={{
            backgroundColor: "transparent",
            border: "2px solid white",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            marginBottom: "20px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ← Back
        </button>

        {/* Emergency contacts grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}>
          {emergencyContacts.map((section, index) => (
            <div key={index} style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
                color: "#ff4444",
                fontSize: "16px",
                fontWeight: "bold"
              }}>
                <span style={{ marginRight: "8px", fontSize: "18px" }}>📞</span>
                {section.category}
              </div>
              {section.contacts.map((contact, contactIndex) => (
                <div key={contactIndex} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: contactIndex < section.contacts.length - 1 ? "1px solid #f0f0f0" : "none",
                  gap: "10px"
                }}>
                  <span style={{ color: "#333", fontWeight: "500", flex: "1", minWidth: "0" }}>
                    {contact.name}
                  </span>
                  <button
                    onClick={() => handleContactCall(contact.number)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#333",
                      fontWeight: "bold",
                      cursor: "pointer",
                      textDecoration: "underline",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                  >
                    {contact.number}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Safety tips */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "20px",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
            color: "#333",
            fontSize: "16px",
            fontWeight: "bold"
          }}>
            <span style={{ marginRight: "8px", fontSize: "18px" }}>ℹ️</span>
            Australian Highway Safety Tips
          </div>
          {safetyTips.map((tip, index) => (
            <div key={index} style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "8px",
              paddingLeft: "8px"
            }}>
              • {tip}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        backgroundColor: "#f9f9f9",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Emergency Call Button */}
      <button
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "280px",
          maxHeight: "280px",
          borderRadius: "50%",
          backgroundColor: "red",
          color: "white",
          fontSize: "22px",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          lineHeight: "1.4",
          whiteSpace: "pre-line",
          boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
        }}
        onClick={handleEmergencyCall}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
            ⚠️ Emergency
          </div>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>
            Press for help
          </div>
        </div>
      </button>

      {/* Emergency Contacts Rectangle at Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "320px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            📞
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "2px",
              }}
            >
              Emergency Contacts
            </div>
            <div
              style={{
                color: "#333",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {emergencyNumber}
            </div>
          </div>
          <button
            onClick={() => setShowContactsPage(true)}
            style={{
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            View All
          </button>
        </div>
      </div>
    </div>
  )
}