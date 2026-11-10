const form = document.getElementById("medicineForm");
const message = document.getElementById("formMessage");

if (form) {
form.addEventListener("submit", async function (event) {
event.preventDefault();


message.textContent = "Submitting your request...";

const formData = new FormData(form);

const data = {
  fullName: formData.get("fullName"),
  city: formData.get("city"),
  medicineName: formData.get("medicineName"),
  quantity: formData.get("quantity"),
  expiryDate: formData.get("expiryDate"),
  packagingCondition: formData.get("packaging"),
  collectionReason: formData.get("reason")
};

try {
  const response = await fetch("/api/medicines", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Submission failed");
  }

  message.textContent = "Your medicine request was submitted successfully!";
  form.reset();
} catch (error) {
  message.textContent = "Submission failed: " + error.message;
  console.error("Medicine submission error:", error);
}


});
}
