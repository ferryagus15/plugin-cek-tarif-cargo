(function(){
    // Data entries: array objek {kotaAwal, kotaTujuan, layanan, biaya, estimasi}
    let dataEntries = [];

    // Untuk edit mode: menyimpan indeks entry yang diedit, null jika tambah baru
    let editIndex = null;

    // Sort state
    let currentSort = { key: null, ascending: true };

    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 20;

    // DOM Elements
    const containerManage = document.getElementById('container-manage-data');
    const tableBody = document.getElementById('tableBodyEntries');
    const messageManage = document.getElementById('messageManageData');
    const btnOpenAddEntryModal = document.getElementById('btnOpenAddEntryModal');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('paginationContainer');

    const modalAddEdit = document.getElementById('modalAddEditEntry');
    const modalTitle = document.getElementById('modalAddEditEntryTitle');
    const closeModalBtn = document.getElementById('closeAddEditEntry');
    const btnSaveEntry = document.getElementById('btnSaveEntry');
    const btnCancelEntry = document.getElementById('btnCancelEntry');
    const messageModalAddEdit = document.getElementById('messageModalAddEdit');

    // Functions to open and close modal
    function openModal(modal) {
        modal.style.display = 'flex';
        // Focus on first input in modal for accessibility
        const firstInput = modal.querySelector('input, select, textarea, button');
        if(firstInput) firstInput.focus();
    }
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Add event listeners for close and cancel buttons to close modal
    if(closeModalBtn){
        closeModalBtn.addEventListener('click', () => {
            closeModal(modalAddEdit);
        });
    }
    if(btnCancelEntry){
        btnCancelEntry.addEventListener('click', () => {
            closeModal(modalAddEdit);
        });
    }

    // Fetch data from API
    function fetchData(){
        jQuery.ajax({
            url: ajaxurl,
            method: 'POST',
            data: { action: 'get_tarif_cargo' },
            success: function(response){
                if(response.success){
                    dataEntries = response.data;
                    currentPage = 1; // reset to first page on new data
                    renderTable();
                    resetAutocompleteData();
                } else {
                    messageManage.textContent = 'Gagal memuat data.';
                }
            },
            error: function(){
                messageManage.textContent = 'Terjadi kesalahan saat memuat data.';
            }
        });
    }

    // Add new entry via API
    function addEntry(entry){
        jQuery.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'add_tarif_cargo',
                kotaAwal: entry.kotaAwal,
                kotaTujuan: entry.kotaTujuan,
                layanan: entry.layanan,
                biaya: entry.biaya,
                estimasi: entry.estimasi
            },
            success: function(response){
                if(response.success){
                    messageManage.textContent = 'Data baru berhasil ditambahkan.';
                    fetchData();
                    closeModal(modalAddEdit);
                } else {
                    messageModalAddEdit.innerHTML = '<div class="error">' + response.data + '</div>';
                }
            },
            error: function(){
                messageModalAddEdit.innerHTML = '<div class="error">Terjadi kesalahan saat menambahkan data.</div>';
            }
        });
    }

    // Edit entry via API
    function editEntry(id, entry){
        jQuery.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'edit_tarif_cargo',
                id: id,
                kotaAwal: entry.kotaAwal,
                kotaTujuan: entry.kotaTujuan,
                layanan: entry.layanan,
                biaya: entry.biaya,
                estimasi: entry.estimasi
            },
            success: function(response){
                if(response.success){
                    messageManage.textContent = 'Data berhasil diperbarui.';
                    fetchData();
                    closeModal(modalAddEdit);
                } else {
                    messageModalAddEdit.innerHTML = '<div class="error">' + response.data + '</div>';
                }
            },
            error: function(){
                messageModalAddEdit.innerHTML = '<div class="error">Terjadi kesalahan saat memperbarui data.</div>';
            }
        });
    }

    // Delete entry via API
    function deleteEntry(idx){
        if(confirm('Apakah Anda yakin ingin menghapus data ini?')){
            const id = dataEntries[idx].id;
            jQuery.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'delete_tarif_cargo',
                    id: id
                },
                success: function(response){
                    if(response.success){
                        messageManage.textContent = 'Data berhasil dihapus.';
                        fetchData();
                    } else {
                        messageManage.textContent = 'Gagal menghapus data: ' + response.data;
                    }
                    setTimeout(() => messageManage.textContent = '', 3000);
                },
                error: function(){
                    messageManage.textContent = 'Terjadi kesalahan saat menghapus data.';
                    setTimeout(() => messageManage.textContent = '', 3000);
                }
            });
        }
    }

    // Expose functions to global scope for inline onclick handlers
    window.openEditModal = openEditModal;
    window.deleteEntry = deleteEntry;

    // Open modal tambah data
    btnOpenAddEntryModal.addEventListener('click', () => {
        editIndex = null;
        modalTitle.textContent = 'Tambah Data Tarif';
        resetModalForm();
        openModal(modalAddEdit);
    });

    // Open modal edit data
    function openEditModal(idx){
        editIndex = idx;
        const entry = dataEntries[idx];
        modalTitle.textContent = 'Edit Data Tarif';
        inputModalKotaAwal.value = entry.kotaAwal;
        inputModalKotaTujuan.value = entry.kotaTujuan;
        selectModalLayanan.value = entry.layanan;
        inputModalBiaya.value = entry.biaya;
        inputModalEstimasi.value = entry.estimasi;
        messageModalAddEdit.innerHTML = '';
        openModal(modalAddEdit);
    }

    // Reset modal form input kosong & pesan
    function resetModalForm(){
        inputModalKotaAwal.value = '';
        inputModalKotaTujuan.value = '';
        selectModalLayanan.value = 'port';
        inputModalBiaya.value = '';
        inputModalEstimasi.value = '';
        messageModalAddEdit.innerHTML = '';
    }

    // Simpan data dari modal (tambah / edit)
    btnSaveEntry.addEventListener('click', () => {
        messageModalAddEdit.innerHTML = '';
        const kotaAwal = inputModalKotaAwal.value.trim();
        const kotaTujuan = inputModalKotaTujuan.value.trim();
        const layanan = selectModalLayanan.value;
        const biayaRaw = inputModalBiaya.value.trim();
        const estimasiRaw = inputModalEstimasi.value.trim();

        if(!kotaAwal){
            messageModalAddEdit.innerHTML = '<div class="error">Kota Awal harus diisi.</div>';
            return;
        }
        if(!kotaTujuan){
            messageModalAddEdit.innerHTML = '<div class="error">Kota Tujuan harus diisi.</div>';
            return;
        }
        if(kotaAwal.toLowerCase() === kotaTujuan.toLowerCase()){
            messageModalAddEdit.innerHTML = '<div class="error">Kota Awal dan Kota Tujuan tidak boleh sama.</div>';
            return;
        }
        if(!biayaRaw || isNaN(biayaRaw) || Number(biayaRaw) <= 0){
            messageModalAddEdit.innerHTML = '<div class="error">Masukkan biaya per Kg yang valid (lebih dari 0).</div>';
            return;
        }
        if(!estimasiRaw.match(/^(\d+)(-(\d+))?$/)){
            messageModalAddEdit.innerHTML = '<div class="error">Estimasi harus berupa angka atau rentang angka, contoh: 1 atau 1-4.</div>';
            return;
        }
        const biaya = Number(biayaRaw);
        // Remove normalization to preserve original casing
        // const kotaAwalNorm = kotaAwal.charAt(0).toUpperCase() + kotaAwal.slice(1).toLowerCase();
        // const kotaTujuanNorm = kotaTujuan.charAt(0).toUpperCase() + kotaTujuan.slice(1).toLowerCase();
        // Use original input casing
        const kotaAwalNorm = kotaAwal;
        const kotaTujuanNorm = kotaTujuan;
        // Cek duplikat (kecuali untuk edit index yang sama)
        const duplikat = dataEntries.findIndex((e, i) =>
            i !== editIndex &&
            e.kotaAwal.toLowerCase() === kotaAwalNorm.toLowerCase() &&
            e.kotaTujuan.toLowerCase() === kotaTujuanNorm.toLowerCase() &&
            e.layanan === layanan
        );
        if(duplikat !== -1){
            messageModalAddEdit.innerHTML = '<div class="error">Data dengan kombinasi Kota Awal, Kota Tujuan, dan Layanan sudah ada.</div>';
            return;
        }
        const entry = {
            kotaAwal: kotaAwalNorm,
            kotaTujuan: kotaTujuanNorm,
            layanan: layanan,
            biaya: biaya,
            estimasi: estimasiRaw
        };
        if(editIndex === null){
            // Tambah data baru via API
            addEntry(entry);
        } else {
            // Edit data lama via API
            const id = dataEntries[editIndex].id;
            editEntry(id, entry);
        }
    });

    // --- Autocomplete input for Modal Kota Awal/Tujuan ---
    function autocomplete(inputEl, listEl, candidates){
        let currentFocus = -1;
        inputEl.addEventListener('input', function(){
            const val = this.value.trim().toLowerCase();
            closeAllLists();
            if(!val) return;
            listEl.style.display = 'block';
            listEl.setAttribute('aria-expanded', 'true');
            let count = 0;
            candidates.forEach(cand => {
                if(cand.toLowerCase().includes(val) || cand.toLowerCase().startsWith(val)) {
                    const item = document.createElement('div');
                    item.textContent = cand;
                    item.setAttribute('role','option');
                    item.addEventListener('click', () => {
                        inputEl.value = cand;
                        closeAllLists();
                    });
                    listEl.appendChild(item);
                    count++;
                }
            });
            if(count === 0) {
                const noItem = document.createElement('div');
                noItem.textContent = 'Tidak ditemukan';
                noItem.style.fontStyle = 'italic';
                listEl.appendChild(noItem);
            }
        });
        inputEl.addEventListener('keydown', function(e){
            const items = listEl.getElementsByTagName('div');
            if(e.key === 'ArrowDown') {
                currentFocus++;
                addActive(items);
                e.preventDefault();
            } else if(e.key === 'ArrowUp') {
                currentFocus--;
                addActive(items);
                e.preventDefault();
            } else if(e.key === 'Enter') {
                e.preventDefault();
                if(currentFocus > -1 && items[currentFocus]){
                    items[currentFocus].click();
                }
            }
        });
        function addActive(items){
            if(!items) return false;
            removeActive(items);
            if(currentFocus >= items.length) currentFocus = 0;
            if(currentFocus < 0) currentFocus = items.length -1;
            items[currentFocus].classList.add('autocomplete-active');
        }
        function removeActive(items){
            Array.from(items).forEach(item=>item.classList.remove('autocomplete-active'));
        }
        function closeAllLists(){
            while(listEl.firstChild){
                listEl.removeChild(listEl.firstChild);
            }
            listEl.style.display = 'none';
            listEl.setAttribute('aria-expanded', 'false');
            currentFocus = -1;
        }
        document.addEventListener('click', function(e){
            if(e.target !== inputEl && e.target.parentNode !== listEl){
                closeAllLists();
            }
        });
    }

    // Reset data autocomplete kota modal selects
    function resetAutocompleteData(){
        const unikKotaAwal = [...new Set(dataEntries.map(e => e.kotaAwal))].sort();
        const unikKotaTujuan = [...new Set(dataEntries.map(e => e.kotaTujuan))].sort();
        autocomplete(inputModalKotaAwal, modalListKotaAwal, unikKotaAwal);
        autocomplete(inputModalKotaTujuan, modalListKotaTujuan, unikKotaTujuan);
    }

    // Sorting functionality for Kelola Data Tarif table
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sortKey = button.getAttribute('data-sort');
            if(currentSort.key === sortKey){
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort.key = sortKey;
                currentSort.ascending = true;
            }
            renderTable();
        });
    });

    // Update renderTable function to apply sorting only
    function renderTable(){
        let filteredEntries = [...dataEntries];

        // Apply search filter
        const searchTerm = searchInput.value.trim().toLowerCase();
        if(searchTerm){
            filteredEntries = filteredEntries.filter(entry => 
                entry.kotaAwal.toLowerCase().includes(searchTerm) ||
                entry.kotaTujuan.toLowerCase().includes(searchTerm) ||
                entry.layanan.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        if(currentSort.key){
            filteredEntries.sort((a,b) => {
                let valA = a[currentSort.key];
                let valB = b[currentSort.key];
                // For biaya, compare as numbers
                if(currentSort.key === 'biaya'){
                    valA = Number(valA);
                    valB = Number(valB);
                } else {
                    valA = valA.toString().toLowerCase();
                    valB = valB.toString().toLowerCase();
                }
                if(valA < valB) return currentSort.ascending ? -1 : 1;
                if(valA > valB) return currentSort.ascending ? 1 : -1;
                return 0;
            });
        }

        // Pagination calculations
        const totalRows = filteredEntries.length;
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        if(currentPage > totalPages) currentPage = totalPages || 1;
        const startIdx = (currentPage - 1) * rowsPerPage;
        const endIdx = startIdx + rowsPerPage;
        const pageEntries = filteredEntries.slice(startIdx, endIdx);

        // Render table rows
        tableBody.innerHTML = '';
        // Helper function to format number with thousands separator (dot) for Indonesian locale
        function formatBiaya(value) {
            if (typeof value === 'number') {
                return value.toLocaleString('id-ID');
            }
            const num = Number(value);
            if (isNaN(num)) return value;
            return num.toLocaleString('id-ID');
        }

        pageEntries.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            let estimasiText = entry.estimasi.trim();
            if(!estimasiText.toLowerCase().endsWith('hari')){
                estimasiText += ' hari';
            }
            tr.innerHTML = `
    <td>${startIdx + idx + 1}</td>
    <td>${entry.kotaAwal}</td>
    <td>${entry.kotaTujuan}</td>
    <td>${entry.layanan.charAt(0).toUpperCase() + entry.layanan.slice(1)}</td>
    <td>${formatBiaya(entry.biaya)}</td>
    <td>${estimasiText}</td>
    <td class="table-actions">
        <button class="btn-edit" aria-label="Edit" title="Edit" onclick="openEditModal(${startIdx + idx})" style="background:none; border:none; cursor:pointer; padding:0; margin-right:8px;">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete" aria-label="Hapus" title="Hapus" onclick="deleteEntry(${startIdx + idx})" style="background:none; border:none; cursor:pointer; padding:0;">
            <i class="fas fa-trash"></i>
        </button>
    </td>
`;
            tableBody.appendChild(tr);
        });

        // Render pagination controls
        renderPagination(totalPages);
    }

    // Render pagination buttons
    function renderPagination(totalPages){
        paginationContainer.innerHTML = '';
        if(totalPages <= 1) return;

        for(let i = 1; i <= totalPages; i++){
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = (i === currentPage) ? 'pagination-btn active' : 'pagination-btn';
            btn.addEventListener('click', () => {
                if(i !== currentPage){
                    currentPage = i;
                    renderTable();
                }
            });
            paginationContainer.appendChild(btn);
        }
    }

    // Search input event listener
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderTable();
    });

    // Close modal on click outside or Escape key
    window.addEventListener('click', (e) => {
        if(e.target === modalAddEdit) closeModal(modalAddEdit);
    });
    window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape'){
            if(modalAddEdit.style.display === 'flex')
                closeModal(modalAddEdit);
        }
    });

    // Add event listeners for close and cancel buttons to close modal
    if(closeModalBtn){
        closeModalBtn.addEventListener('click', () => {
            closeModal(modalAddEdit);
        });
    }
    if(btnCancelEntry){
        btnCancelEntry.addEventListener('click', () => {
            closeModal(modalAddEdit);
        });
    }

    // Inisialisasi awal
    fetchData();

})();
