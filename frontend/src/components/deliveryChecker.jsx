"use client";
import { useState } from "react";

export function DeliveryChecker() {
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState(null);

  const checkDelivery = () => {
    if (!pincode || pincode.length !== 6) {
      setStatus("invalid");
      return;
    }

    // mock logic
    if (pincode.startsWith("4")) {
      setStatus("available");
    } else {
      setStatus("unavailable");
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold tracking-wide text-gray-600 mb-3">
        CHECK DELIVERY
      </h3>

      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && checkDelivery()}
          placeholder="Enter pincode"
          className="w-64 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-600"
        />

        <button
          onClick={checkDelivery}
          className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
        >
          Check
        </button>
      </div>

      {status === "available" && (
        <p className="mt-3 text-sm text-green-600 font-medium">
          ✔ Delivery available (2–4 days)
        </p>
      )}

      {status === "unavailable" && (
        <p className="mt-3 text-sm text-red-500 font-medium">
          ✖ Not deliverable to this pincode
        </p>
      )}

      {status === "invalid" && (
        <p className="mt-3 text-sm text-yellow-600 font-medium">
          ⚠ Enter valid 6-digit pincode
        </p>
      )}
    </div>
  );
}
