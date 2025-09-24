import { useEffect, useState } from "react"
import axios from "axios"

export default function App() {
  const [showPopup, setShowPopup] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [timer, setTimer] = useState(null)

  // Replace with your actual emergency number or fetch it from backend
  const emergencyNumber = "0498158685"

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || ""
    axios.get(`${base}/api/health/`).then(r => setHealth(r.data))
    axios.get(`${base}/api/samples/`).then(r => setSamples(r.data))
  }, [])

  const startCountdown = () => {
    setCountdown(5) // reset countdown
    setShowPopup(true)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval)
          handleCall()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimer(interval)
  }

  const handleCall = () => {
    // Opens dialer on mobile devices
    window.location.href = `tel:${emergencyNumber}`
    setShowPopup(false)
  }

  const cancelCall = () => {
    cleanup()
  }

  const cleanup = () => {
    if (timer) clearInterval(timer)
    setShowPopup(false)
    setCountdown(5)
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
        onClick={startCountdown}
      >
{showPopup && countdown > 0
          ? `⚠️\n${countdown}s`
          : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
                  ⚠️ Emergency
                </div>
                <div style={{ fontSize: "16px", fontWeight: "normal" }}>
                  Press for help
                </div>
              </div>
            )}
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
          <div>
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
        </div>
      </div>

      {/* Confirmation Popup */}
      {showPopup && (
        <>
          {/* Dark overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
          />

          {/* Popup box */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "320px",
              textAlign: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              zIndex: 1000,
            }}
          >
            <h3 style={{ margin: 0, color: "red" }}>⚠️ Emergency Alert</h3>
            <p style={{ margin: "10px 0", fontSize: "16px", color: "#333" }}>
              Calling your emergency contact in{" "}
              <span style={{ color: "red", fontWeight: "bold" }}>
                {countdown} Seconds
              </span>
            </p>
            <button
              style={{
                backgroundColor: "black",
                color: "white",
                padding: "10px 20px",
                borderRadius: "50px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={cancelCall}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}