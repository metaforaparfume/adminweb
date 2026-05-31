/* ═══════════════════════════════════════════
   TENNISPRO ACADEMY — admin.js (FULL BACKEND DATABASE)
   ═══════════════════════════════════════════ */

// Tunggu sampai window.db ter-ekspos dari HTML
window.addEventListener('DOMContentLoaded', () => {
  const checkFirebase = setInterval(() => {
    if (window.db) {
      clearInterval(checkFirebase);
      initAdminDashboard();
    }
  }, 100);
});

function initAdminDashboard() {
  console.log("🔥 Firebase terhubung ke admin.js. Memulai penarikan data...");

  // Jalankan pembaca data realtime dari Firebase Firestore
  listenToBookings();
  listenToStudents();
  listenToCoaches();
  listenToSettings();

  // Daftarkan event listener untuk form input data baru
  initFormListeners();
}

/* ════════════════════════════════
   1. LOGIKA KELOLA BOOKING
   ════════════════════════════════ */
function listenToBookings() {
  const q = window.query(window.collection(window.db, "bookings"), window.orderBy("timestamp", "desc"));
  
  window.onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("adminTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    let pendingCount = 0;
    let confirmedCount = 0;

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#777;">Belum ada data booking masuk.</td></tr>`;
      document.getElementById("countPending").innerText = "0";
      document.getElementById("countConfirmed").innerText = "0";
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      // Hitung statistik counter atas
      if (data.status === "Pending") pendingCount++;
      if (data.status === "Confirmed") confirmedCount++;

      // Badge status warna
      let statusColor = "#f39c12"; // Pending (Kuning)
      if (data.status === "Confirmed") statusColor = "#2a9d8f"; // Hijau
      if (data.status === "Rejected") statusColor = "#e63946"; // Merah

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${data.name || "Guest"}</strong><br><small style="color:#aaa;">ID: ${id.substring(0,6)}...</small></td>
        <td>${data.date || "-"}<br><small style="background:#222; padding:2px 4px; border-radius:3px;">${data.time || "-"}</small></td>
        <td>👤 ${data.coach || "-"}</td>
        <td>🎾 Court ${data.court || "-"}</td>
        <td><small style="text-transform:uppercase; font-weight:bold; color:#00b4d8;">${data.payment || "QRIS"}</small></td>
        <td><span style="color: ${statusColor}; font-weight: bold;">● ${data.status || "Pending"}</span></td>
        <td>
          <button class="btn-approve" onclick="updateBookingStatus('${id}', 'Confirmed')">Approve</button>
          <button class="btn-reject" onclick="updateBookingStatus('${id}', 'Rejected')">Reject</button>
          <button class="btn-delete" onclick="deleteData('bookings', '${id}')">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("countPending").innerText = pendingCount;
    document.getElementById("countConfirmed").innerText = confirmedCount;
  });
}

// Fungsi ganti status booking (Approve/Reject)
window.updateBookingStatus = async function(id, newStatus) {
  try {
    const docRef = window.doc(window.db, "bookings", id);
    await window.updateDoc(docRef, { status: newStatus });
    alert(`Status booking berhasil diubah menjadi: ${newStatus}`);
  } catch (error) {
    console.error("Gagal update status:", error);
    alert("Terjadi kesalahan sistem.");
  }
};


/* ════════════════════════════════
   2. LOGIKA DATA STUDENT
   ════════════════════════════════ */
function listenToStudents() {
  // Menarik data dari tabel 'students' atau 'users' (diatur 'students')
  const q = window.query(window.collection(window.db, "students"));
  
  window.onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("studentTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#777;">Belum ada student yang terdaftar di database.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${data.name || "No Name"}</strong></td>
        <td>📧 ${data.email || "-"}</td>
        <td>${data.joinDate || "Baru Saja"}</td>
        <td><span style="color:#2a9d8f; font-weight:bold;">✓ Active Student</span></td>
        <td>
          <button class="btn-reject" style="background:#555;" onclick="alert('Fitur Suspend Akun menyusul')">Suspend</button>
          <button class="btn-delete" onclick="deleteData('students', '${id}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}


/* ════════════════════════════════
   3. LOGIKA JADWAL COACH
   ════════════════════════════════ */
function listenToCoaches() {
  const q = window.query(window.collection(window.db, "coaches"));
  
  window.onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("coachTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#777;">Belum ada jadwal operasional coach. Silakan tambah di sebelah kiri.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>👤 ${data.name}</strong></td>
        <td>📅 ${data.day}</td>
        <td>⏰ ${data.time}</td>
        <td>
          <button class="btn-delete" onclick="deleteData('coaches', '${id}')">Hapus Sesi</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}


/* ════════════════════════════════
   4. LOGIKA PENGATURAN SYSTEM
   ════════════════════════════════ */
async function listenToSettings() {
  // Membaca konfigurasi global dari Firestore (Document ID: 'global_config')
  const docRef = window.doc(window.db, "settings", "global_config");
  window.onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById("settingAcademyName")) document.getElementById("settingAcademyName").value = data.academyName || "";
      if (document.getElementById("settingPrice")) document.getElementById("settingPrice").value = data.pricePerSession || "";
      if (document.getElementById("settingWA")) document.getElementById("settingWA").value = data.whatsappAdmin || "";
    }
  });
}


/* ════════════════════════════════
   5. EVENT HANDLER FORM INPUT
   ════════════════════════════════ */
function initFormListeners() {
  // Handler Tambah Coach
  const formCoach = document.getElementById("formAddCoach");
  if (formCoach) {
    formCoach.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("coachName").value;
      const day = document.getElementById("coachDay").value;
      const time = document.getElementById("coachTime").value;

      try {
        await window.addDoc(window.collection(window.db, "coaches"), {
          name: name,
          day: day,
          time: time,
          timestamp: new Date()
        });
        alert("Sukses menambah jadwal baru untuk " + name);
        formCoach.reset();
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan data ke Firebase.");
      }
    });
  }

  // Handler Update Pengaturan
  const formSettings = document.getElementById("formSettings");
  if (formSettings) {
    formSettings.addEventListener("submit", async (e) => {
      e.preventDefault();
      const academyName = document.getElementById("settingAcademyName").value;
      const price = document.getElementById("settingPrice").value;
      const wa = document.getElementById("settingWA").value;

      try {
        // Menggunakan setDoc agar dokumen konfigurasinya menimpa dokumen ID yang sama terus menerus
        await window.setDoc(window.doc(window.db, "settings", "global_config"), {
          academyName: academyName,
          pricePerSession: price,
          whatsappAdmin: wa,
          lastUpdated: new Date()
        });
        alert("Pengaturan sistem berhasil di-update secara global!");
      } catch (err) {
        console.error(err);
        alert("Gagal memperbarui pengaturan.");
      }
    });
  }
}

// Fungsi Global untuk hapus data dokumen koleksi apapun
window.deleteData = async function(collectionName, id) {
  if (confirm("Apakah kamu yakin ingin menghapus data ini secara permanen dari Firebase?")) {
    try {
      await window.deleteDoc(window.doc(window.db, collectionName, id));
      alert("Data berhasil dihapus dari database.");
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data.");
    }
  }
};