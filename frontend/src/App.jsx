import { useEffect, useState } from "react"
import axios from "axios"

export default function App() {
  const [showPopup, setShowPopup] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [timer, setTimer] = useState(null)

  // Replace with your actual emergency number or fetch it from backend
  const emergencyNumber = "123456789"

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
    // window.location.href = `tel:${emergencyNumber}`
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
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "flex-start",
        minHeight: "100vh",
        width: "100vw",
        paddingTop: "60px"
        }}
    >
      {/* Emergency Call Button */}
        <button
          style={{
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            backgroundColor: "red",
            color: "white",
            fontSize: "25px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
          onClick={startCountdown}
          className="px-6 py-3 text-xl font-bold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700"
        >
          <h3>{showPopup && countdown > 0
          ? `⚠️ ${countdown} seconds`
          : "🚨 Emergency\nPress for help"}</h3>
        </button>

      {/* Confirmation Popup */}
      {showPopup && (
        <div
          style={{
            position: "flex",
            top: "50%",
            left: "70%",
            justifyContent: "flex-start",
            transform: "translate(-2%,10%)",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            width: "300px",
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          <h3 style={{ margin: 0, color: "red" }}>⚠️ Emergency Alert</h3>
          <p style={{ margin: "10px 0" }}>
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
        )}
    </div>
  )
}
