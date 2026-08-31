export const userGuideContent = {
  en: {
    title: "MOSC Mortuary Management System: End-to-End User Guide",
    welcome: "Welcome to the MOSC Mortuary Management System tutorial. This step-by-step guide is designed to walk you through the entire lifecycle of the application, from initial staff onboarding to body registration, cabin management, billing, and housekeeping operations.",
    modules: [
      {
        id: "module-1",
        title: "Module 1: Staff Registration and Approval",
        blocks: [
          { type: "paragraph", text: "Every staff member must have an approved account before logging into the system." },
          { type: "heading", text: "Step 1: Submit Your Registration" },
          { type: "list-item", text: "Navigate to the main login screen of the application." },
          { type: "list-item", text: "Click the \"Register as Staff\" link located right below the login form." },
          { type: "list-item", text: "Complete the registration form by filling in all required fields:" },
          { type: "sub-list-item", text: "Full Name" },
          { type: "sub-list-item", text: "Employee ID" },
          { type: "sub-list-item", text: "Department (Choose either M Staff or House Keeping)" },
          { type: "sub-list-item", text: "Phone Number" },
          { type: "sub-list-item", text: "Email Address" },
          { type: "sub-list-item", text: "Password" },
          { type: "list-item", text: "Click the \"Submit Registration\" button at the bottom of the form." },
          { type: "list-item", text: "When the success modal appears stating \"Registration Submitted! Pending Admin Approval\", click \"Go to Login\" to return to the sign-in screen." },
          { type: "heading", text: "Step 2: Administrator Approval (For Admins Only)" },
          { type: "list-item", text: "Navigate to the admin portal at /adminlogin and log in." },
          { type: "list-item", text: "From the Admin Dashboard sidebar, click on \"User Approvals\" (marked with a UserCheck icon)." },
          { type: "list-item", text: "Review the list of pending registrations. Click the \"View\" (eye icon) button next to a user to see their details." },
          { type: "list-item", text: "Action the request:" },
          { type: "sub-list-item", text: "To Approve: Click the green \"Approve\" button." },
          { type: "sub-list-item", text: "To Reject: Click the red \"Reject\" button and provide an optional reason." },
          { type: "heading", text: "Step 3: Logging In" },
          { type: "list-item", text: "Return to the standard login screen." },
          { type: "list-item", text: "Enter your Employee ID and Password." },
          { type: "list-item", text: "Click the \"Sign In\" button." },
          { type: "note", text: "Note: If approved, you will access the main dashboard. If your account is still pending or rejected, an error message will display." }
        ]
      },
      {
        id: "module-2",
        title: "Module 2: Deceased Body Registration (M Staff)",
        blocks: [
          { type: "paragraph", text: "Once logged in as M Staff, follow these steps to register an intake." },
          { type: "list-item", text: "Click \"Body Registration\" on the dashboard sidebar." },
          { type: "list-item", text: "Click the \"Register New Body\" button located in the top-right corner. A slide-out form will appear." },
          { type: "list-item", text: "Select your workflow from the Body Type dropdown:" },
          { type: "heading", text: "Option A: Non-MLC Flow (Standard Cases)" },
          { type: "list-item", text: "Select \"Non-MLC\" from the dropdown." },
          { type: "list-item", text: "Fill out the general details: Patient Name, Age, Gender, Hospital Number, Address, and Reason of Death." },
          { type: "list-item", text: "Complete the Brought By / Informant Details section." },
          { type: "list-item", text: "Click \"Save Registration\". The system places the record into a Pending Allocation state." },
          { type: "heading", text: "Option B: MLC Flow (Medico-Legal Cases)" },
          { type: "list-item", text: "Select \"MLC\" from the dropdown." },
          { type: "list-item", text: "Complete the mandatory Police Information fields: Police Station Name, Station SI Name, Present Police Officer Name, and MLC Number." },
          { type: "list-item", text: "Fill in the Witness Details (names and addresses)." },
          { type: "list-item", text: "Address the \"Freezer Required?\" checkbox (Checked by default):" },
          { type: "sub-list-item", text: "If Checked: The body moves forward to Cabin Allocation and Billing workflows." },
          { type: "sub-list-item", text: "If Unchecked: The body is recorded for legal tracking only, bypasses cabins/billing entirely, and goes straight to a Registered final state." },
          { type: "list-item", text: "Click \"Save Registration\"." },
          { type: "note", text: "(Optional) To download the official paperwork, find the record in the actions menu and click \"Print MLC Doc\" to download the PDF." }
        ]
      },
      {
        id: "module-3",
        title: "Module 3: Cabin Allocation (M Staff)",
        blocks: [
          { type: "paragraph", text: "Bodies that require a freezer must be assigned an available cabin." },
          { type: "list-item", text: "Click \"Cabin Allocation\" on the dashboard sidebar." },
          { type: "list-item", text: "The screen is split into two areas: Pending Bodies and Available Cabins." },
          { type: "list-item", text: "Locate the newly registered body under the Pending list and click the \"Allocate\" button next to it." },
          { type: "list-item", text: "A modal will pop up displaying available cabins highlighted in green." },
          { type: "list-item", text: "Choose an available cabin from the dropdown selection." },
          { type: "list-item", text: "Click \"Confirm Allocation\"." },
          { type: "note", text: "Result: The body status updates to Allocated, and the selected cabin turns red (Occupied)." }
        ]
      },
      {
        id: "module-4",
        title: "Module 4: Billing Generation & Settlement (M Staff)",
        blocks: [
          { type: "paragraph", text: "Before a body can be released, billing must be processed. The system splits costs into two distinct receipts." },
          { type: "heading", text: "Step 1: Generate the Invoices" },
          { type: "list-item", text: "Click \"Billing\" on the dashboard sidebar." },
          { type: "list-item", text: "Find the allocated body in the active billing list and click \"Generate Bill\"." },
          { type: "list-item", text: "Review the automatically calculated Mortuary Stay Charges in the modal." },
          { type: "list-item", text: "Apply Concessions (If applicable): * If the deceased is related to a hospital staff member, click the \"Staff Concession Case\" toggle." },
          { type: "sub-list-item", text: "Provide the Staff Name, Staff ID, and Relation. This applies a 100% discount to the stay charges." },
          { type: "list-item", text: "Apply Service Charges: * Under the Service section, toggle \"Body Dressing Required?\" if the service was performed. The approved tariff will be added automatically. Note: Service charges cannot be discounted." },
          { type: "list-item", text: "Click \"Confirm & Generate Bill\"." },
          { type: "heading", text: "Step 2: Settle and Print" },
          { type: "list-item", text: "Locate the body's row in the Billing table, which now displays individual action buttons." },
          { type: "list-item", text: "Click \"Settle Stay Bill\" and/or \"Settle Service Bill\" to record payments as received." },
          { type: "list-item", text: "Click \"Print Stay Receipt\" and/or \"Print Service Receipt\" to download the professional PDF invoices for the family or records." }
        ]
      },
      {
        id: "module-5",
        title: "Module 5: Body Release (M Staff)",
        blocks: [
          { type: "paragraph", text: "Perform this step once all applicable bills are settled to officially hand over the body." },
          { type: "list-item", text: "Click \"Body Release\" on the dashboard sidebar to view bodies currently occupying cabins." },
          { type: "list-item", text: "Locate the specific record and click \"Release Body\"." },
          { type: "list-item", text: "Complete the release form modal:" },
          { type: "sub-list-item", text: "Released To: Name of the individual taking custody of the body." },
          { type: "sub-list-item", text: "Relation: Their relationship to the deceased." },
          { type: "sub-list-item", text: "ID Proof: Government ID details (e.g., Voter ID or other identification details)." },
          { type: "sub-list-item", text: "For MLC Cases Only: Fill in the mandatory Handed over by and ID badge fields under the Police Verification section." },
          { type: "list-item", text: "Click \"Confirm Release\"." },
          { type: "note", text: "Result: The body's status changes to Released. The cabin is automatically locked out from new allocations and turns yellow (Needs Cleaning)." }
        ]
      },
      {
        id: "module-6",
        title: "Module 6: Housekeeping Module (Housekeeping Staff & Supervisors)",
        blocks: [
          { type: "paragraph", text: "After a body is released, the cabin must pass through a 3-step sanitation cycle before it becomes available again." },
          { type: "heading", text: "1. Start Cleaning (Housekeeping Staff)" },
          { type: "list-item", text: "Log into the system using a Housekeeping account to view the Housekeeping Dashboard." },
          { type: "list-item", text: "Scan the list for any yellow cabins marked \"Needs Cleaning\"." },
          { type: "list-item", text: "Click the \"Start Cleaning\" button. The cabin color changes to orange (Cleaning In Progress)." },
          { type: "heading", text: "2. Mark as Complete (Housekeeping Staff)" },
          { type: "list-item", text: "Once the physical sanitation of the cabin is finished, return to the dashboard." },
          { type: "list-item", text: "Click the \"Mark Complete\" button next to the cabin. The cabin color changes to blue (Pending Verification)." },
          { type: "heading", text: "3. Verify & Open (Supervisor / M Staff)" },
          { type: "list-item", text: "A supervisor or M Staff member must physically inspect the cleaned cabin." },
          { type: "list-item", text: "Log into the system, navigate to the housekeeping view, and click \"Verify & Open\"." },
          { type: "note", text: "The cabin status immediately reverts to green (Available), entering it back into the active rotation for the Cabin Allocation module." }
        ]
      }
    ]
  },
  ml: {
    title: "MOSC മോർച്ചറി മാനേജ്മെന്റ് സിസ്റ്റം: ഒരു സമ്പൂർണ്ണ ഉപയോക്തൃ സഹായി (User Guide)",
    welcome: "MOSC മോർച്ചറി മാനേജ്മെന്റ് സിസ്റ്റം ട്യൂട്ടോറിയലിലേക്ക് സ്വാഗതം. ജീവനക്കാരുടെ രജിസ്ട്രേഷൻ, മൃതദേഹം രേഖപ്പെടുത്തൽ, കാബിൻ മാറ്റിവെക്കൽ, ബില്ലിംഗ്, ക്ലീനിംഗ് പ്രവർത്തനങ്ങൾ എന്നിവ എങ്ങനെ ഘട്ടം ഘട്ടമായി ചെയ്യാം എന്ന് ഈ ഗൈഡിലൂടെ മനസ്സിലാക്കാം.",
    modules: [
      {
        id: "module-1",
        title: "മോഡ്യൂൾ 1: സ്റ്റാഫ് രജിസ്ട്രേഷനും അപ്രൂവലും",
        blocks: [
          { type: "paragraph", text: "സിസ്റ്റം ഉപയോഗിക്കുന്നതിന് മുൻപ് എല്ലാ ജീവനക്കാരും നിർബന്ധമായും അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്ത് അഡ്മിന്റെ അനുമതി (Approval) നേടിയിരിക്കണം." },
          { type: "heading", text: "സ്റ്റെപ്പ് 1: രജിസ്ട്രേഷൻ സമർപ്പിക്കേണ്ട വിധം" },
          { type: "list-item", text: "ആപ്ലിക്കേഷന്റെ പ്രധാന ലോഗിൻ (Login) സ്ക്രീൻ തുറക്കുക." },
          { type: "list-item", text: "ലോഗിൻ ഫോമിന് താഴെയുള്ള \"Register as Staff\" എന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "താഴെ പറയുന്ന വിവരങ്ങൾ കൃത്യമായി പൂരിപ്പിക്കുക:" },
          { type: "sub-list-item", text: "പൂർണ്ണമായ പേര് (Full Name)" },
          { type: "sub-list-item", text: "എംപ്ലോയീ ഐഡി (Employee ID)" },
          { type: "sub-list-item", text: "ഡിപ്പാർട്ട്മെന്റ് (നിങ്ങൾ M Staff ആണോ House Keeping ജീവനക്കാരനാണോ എന്ന് തിരഞ്ഞെടുക്കുക)" },
          { type: "sub-list-item", text: "ഫോൺ നമ്പർ" },
          { type: "sub-list-item", text: "ഇമെയിൽ വിലാസം" },
          { type: "sub-list-item", text: "പാസ്വേഡ്" },
          { type: "list-item", text: "ഫോമിന് താഴെയുള്ള \"Submit Registration\" ബട്ടണിൽ ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "സ്ക്രീനിൽ \"Registration Submitted! Pending Admin Approval\" എന്ന മെസ്സേജ് കാണിക്കുമ്പോൾ, \"Go to Login\" ബട്ടണിൽ ക്ലിക്ക് ചെയ്ത് തിരികെ ലോഗിൻ സ്ക്രീനിലേക്ക് പോകുക." },
          { type: "heading", text: "സ്റ്റെപ്പ് 2: അഡ്മിൻ അപ്രൂവൽ (അഡ്മിനിസ്ട്രേറ്റർമാർക്ക് മാത്രം)" },
          { type: "list-item", text: "/adminlogin എന്ന അഡ്മിൻ പോർട്ടൽ വഴി ലോഗിൻ ചെയ്യുക." },
          { type: "list-item", text: "അഡ്മിൻ ഡാഷ്ബോർഡിന്റെ സൈഡ്ബാറിൽ കാണുന്ന \"User Approvals\" (യൂസർചെക്ക് ഐക്കൺ) ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "അനുമതിക്കായി കാത്തിരിക്കുന്ന അപേക്ഷകരുടെ ലിസ്റ്റ് പരിശോധിക്കുക. വിവരങ്ങൾ കാണാൻ അപേക്ഷകന്റെ പേരിന് നേരെയുള്ള \"View\" (കണ്ണിന്റെ ഐക്കൺ) ക്ലിക്ക് ചെയ്യാം." },
          { type: "list-item", text: "നടപടി സ്വീകരിക്കുക:" },
          { type: "sub-list-item", text: "അനുമതി നൽകാൻ: പച്ച നിറത്തിലുള്ള \"Approve\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "sub-list-item", text: "നിരസിക്കാൻ: ചുവപ്പ് നിറത്തിലുള്ള \"Reject\" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് കാരണം രേഖപ്പെടുത്തുക." },
          { type: "heading", text: "സ്റ്റെപ്പ് 3: ലോഗിൻ ചെയ്യേണ്ട വിധം" },
          { type: "list-item", text: "സാധാരണ ലോഗിൻ സ്ക്രീനിലേക്ക് വരിക." },
          { type: "list-item", text: "നിങ്ങളുടെ Employee ID-യും Password-ഉം നൽകുക." },
          { type: "list-item", text: "\"Sign In\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "note", text: "ശ്രദ്ധിക്കുക: അഡ്മിൻ അനുമതി നൽകിയിട്ടുണ്ടെങ്കിൽ നിങ്ങൾക്ക് മെയിൻ ഡാഷ്ബോർഡിലേക്ക് പ്രവേശിക്കാം. അനുമതി ലഭിച്ചിട്ടില്ലെങ്കിലോ അപേക്ഷ നിരസിക്കപ്പെട്ടിട്ടുണ്ടെങ്കിലോ എറർ മെസ്സേജ് കാണിക്കും." }
        ]
      },
      {
        id: "module-2",
        title: "മോഡ്യൂൾ 2: മൃതദേഹം രജിസ്റ്റർ ചെയ്യൽ (M Staff-ന് വേണ്ടി)",
        blocks: [
          { type: "paragraph", text: "ലോഗിൻ ചെയ്ത ശേഷം മൃതദേഹത്തിന്റെ വിവരങ്ങൾ സിസ്റ്റത്തിൽ രേഖപ്പെടുത്താൻ താഴെ പറയുന്നവ ചെയ്യുക." },
          { type: "list-item", text: "ഡാഷ്ബോർഡ് സൈഡ്ബാറിലെ \"Body Registration\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "മുകളിൽ വലതുവശത്തുള്ള \"Register New Body\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ ഒരു ഫോം തുറന്നുവരും." },
          { type: "list-item", text: "Body Type എന്ന ഡ്രോപ്പ്ഡൗണിൽ നിന്നും കേസിന്റെ സ്വഭാവം തിരഞ്ഞെടുക്കുക:" },
          { type: "heading", text: "ഓപ്ഷൻ A: നോൺ-MLC കേസ് (സാധാരണ മരണങ്ങൾ)" },
          { type: "list-item", text: "ഡ്രോപ്പ്ഡൗണിൽ നിന്ന് \"Non-MLC\" എന്നത് തിരഞ്ഞെടുക്കുക." },
          { type: "list-item", text: "മരിച്ച വ്യക്തിയുടെ വിവരങ്ങൾ നൽകുക: പേര്, പ്രായം, ലിംഗഭേദം, ഹോസ്പിറ്റൽ നമ്പർ, വിലാസം, മരണകാരണം." },
          { type: "list-item", text: "മൃതദേഹം കൊണ്ടുവന്ന ആളുടെ വിവരങ്ങൾ (Brought By / Informant Details) പൂരിപ്പിക്കുക." },
          { type: "list-item", text: "\"Save Registration\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. ഇതോടെ ഈ കേസ് Pending Allocation സ്റ്റേറ്റിലേക്ക് മാറും." },
          { type: "heading", text: "ഓപ്ഷൻ B: MLC കേസ് (മെഡിക്കോ-ലീഗൽ / പോലീസ് കേസുകൾ)" },
          { type: "list-item", text: "ഡ്രോപ്പ്ഡൗണിൽ നിന്ന് \"MLC\" എന്നത് തിരഞ്ഞെടുക്കുക." },
          { type: "list-item", text: "നിർബന്ധമായും പൂരിപ്പിക്കേണ്ട പോലീസ് വിവരങ്ങൾ നൽകുക: പോലീസ് സ്റ്റേഷന്റെ പേര്, സ്റ്റേഷൻ എസ്.ഐയുടെ പേര്, നിലവിലുള്ള പോലീസ് ഓഫീസറുടെ പേര്, MLC നമ്പർ." },
          { type: "list-item", text: "സാക്ഷികളുടെ വിവരങ്ങൾ (പേരും വിലാസവും) നൽകുക." },
          { type: "list-item", text: "\"Freezer Required?\" എന്ന ചെക്ക്ബോക്സ് ശ്രദ്ധിക്കുക (ഇത് മുൻകൂട്ടി ടിക്ക് ചെയ്തിട്ടുണ്ടാകും):" },
          { type: "sub-list-item", text: "ടിക്ക് ചെയ്താൽ: മൃതദേഹം കാബിൻ അനുവദിക്കുന്നതിലേക്കും ബില്ലിംഗിലേക്കും പോകും." },
          { type: "sub-list-item", text: "ടിക്ക് മാറ്റി ഒഴിവാക്കിയാൽ: റെക്കോർഡിനായി മാത്രം വിവരങ്ങൾ സൂക്ഷിക്കും, കാബിനോ ബില്ലിംഗോ ആവശ്യമില്ലാതെ നേരിട്ട് Registered എന്ന ഫൈനൽ സ്റ്റേറ്റിലേക്ക് മാറും." },
          { type: "list-item", text: "\"Save Registration\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "note", text: "(ആവശ്യമെങ്കിൽ) ഔദ്യോഗിക രേഖകൾക്കായി ആക്ഷൻ മെനുവിലെ \"Print MLC Doc\" ക്ലിക്ക് ചെയ്ത് PDF ഡൗൺലോഡ് ചെയ്യാം." }
        ]
      },
      {
        id: "module-3",
        title: "മോഡ്യൂൾ 3: കാബിൻ അനുവദിക്കൽ (M Staff-ന് വേണ്ടി)",
        blocks: [
          { type: "paragraph", text: "ഫ്രീസർ ആവശ്യമുള്ള മൃതദേഹങ്ങൾക്ക് ലഭ്യമായ കാബിനുകൾ മാറ്റിവെക്കുന്ന ഘട്ടമാണിത്." },
          { type: "list-item", text: "ഡാഷ്ബോർഡ് സൈഡ്ബാറിലെ \"Cabin Allocation\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "സ്ക്രീനിൽ Pending Bodies (കാബിൻ അനുവദിക്കാനുള്ളവ), Available Cabins (ഒഴിഞ്ഞുകിടക്കുന്ന കാബിനുകൾ) എന്നിങ്ങനെ രണ്ട് ഭാഗങ്ങൾ കാണാം." },
          { type: "list-item", text: "ലിസ്റ്റിൽ നിന്നും പുതിയതായി രജിസ്റ്റർ ചെയ്ത മൃതദേഹം കണ്ടെത്തി അതിന് നേരെയുള്ള \"Allocate\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "ലഭ്യമായ കാബിനുകൾ പച്ച നിറത്തിൽ കാണിക്കുന്ന ഒരു വിൻഡോ (Modal) വരും." },
          { type: "list-item", text: "അതിൽ നിന്നും അനുയോജ്യമായ ഒരു കാബിൻ തിരഞ്ഞെടുക്കുക." },
          { type: "list-item", text: "\"Confirm Allocation\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "note", text: "ഫലം: മൃതദേഹത്തിന്റെ സ്റ്റാറ്റസ് Allocated എന്നും, തിരഞ്ഞെടുത്ത കാബിൻ ചുവപ്പ് നിറത്തിലേക്ക് മാറി Occupied (ഉപയോഗത്തിലാണ്) എന്നും കാണിക്കും." }
        ]
      },
      {
        id: "module-4",
        title: "മോഡ്യൂൾ 4: ബില്ലിംഗ് പ്രക്രിയ (M Staff-ന് വേണ്ടി)",
        blocks: [
          { type: "paragraph", text: "മൃതദേഹം വിട്ടുനൽകുന്നതിന് മുൻപ് ബില്ലിംഗ് പൂർത്തിയാക്കണം. സിസ്റ്റം തുക രണ്ട് വ്യത്യസ്ത റെസിപ്റ്റുകളായാണ് കാണിക്കുക." },
          { type: "heading", text: "സ്റ്റെപ്പ് 1: ബില്ലുകൾ തയ്യാറാക്കൽ" },
          { type: "list-item", text: "സൈഡ്ബാറിലെ \"Billing\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "നിലവിൽ കാബിനിലുള്ള മൃതദേഹങ്ങളുടെ ലിസ്റ്റിൽ നിന്നും ആവശ്യമുള്ളത് കണ്ടെത്തി \"Generate Bill\" ക്ലിക്ക് ചെയ്യുക." },
          { type: "list-item", text: "മോർച്ചറിയിൽ കിടത്തിയ സമയം കണക്കാക്കി സിസ്റ്റം തനിയെ തയ്യാറാക്കിയ Mortuary Stay Charges പരിശോധിക്കുക." },
          { type: "list-item", text: "ഇളവുകൾ (ആവശ്യമെങ്കിൽ): മരിച്ച വ്യക്തി ഹോസ്പിറ്റൽ ജീവനക്കാരുടെ ബന്ധുവാണെങ്കിൽ, \"Staff Concession Case\" ടോഗിൾ ഓൺ ചെയ്യുക. തുടര്ന്ന് ജീവനക്കാരന്റെ പേര്, സ്റ്റാഫ് ഐഡി, ബന്ധം എന്നിവ നൽകുക. ഇത് മോർച്ചറി വാടകയ്ക്ക് 100% ഡിസ്കൗണ്ട് നൽകും." },
          { type: "list-item", text: "സർവീസ് ചാർജുകൾ: മൃതദേഹം ഒരുക്കുന്ന സർവീസ് നൽകിയിട്ടുണ്ടെങ്കിൽ, \"Body Dressing Required?\" ടോഗിൾ ഓൺ ചെയ്യുക. ഇതിനുള്ള നിശ്ചിത തുക ബില്ലിൽ തനിയെ ചേരും. ശ്രദ്ധിക്കുക: സർവീസ് ചാർജുകളിൽ ഇളവ് നൽകാൻ കഴിയില്ല." },
          { type: "list-item", text: "\"Confirm & Generate Bill\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "heading", text: "സ്റ്റെപ്പ് 2: പണം സ്വീകരിക്കലും പ്രിന്റ് എടുക്കലും" },
          { type: "list-item", text: "ബില്ലിംഗ് ടേബിളിൽ ഇപ്പോൾ ഓരോന്നിനും പ്രത്യേകം ബട്ടണുകൾ കാണാം." },
          { type: "list-item", text: "പണം ലഭിച്ച ശേഷം \"Settle Stay Bill\", \"Settle Service Bill\" എന്നിവ ക്ലിക്ക് ചെയ്ത് പെയ്മെന്റ് പൂർത്തിയാക്കുക." },
          { type: "list-item", text: "ബന്ധുക്കൾക്ക് നൽകാനായി \"Print Stay Receipt\", \"Print Service Receipt\" എന്നിവ ക്ലിക്ക് ചെയ്ത് പ്രൊഫഷണൽ PDF ബില്ലുകൾ ഡൗൺലോഡ് ചെയ്യാം." }
        ]
      },
      {
        id: "module-5",
        title: "മോഡ്യൂൾ 5: മൃതദേഹം വിട്ടുനൽകൽ (M Staff-ന് വേണ്ടി)",
        blocks: [
          { type: "paragraph", text: "ബില്ലുകളെല്ലാം അടച്ചുതീർത്ത ശേഷം മൃതദേഹം ബന്ധുക്കൾക്ക് വിട്ടുനൽകുന്ന ഘട്ടമാണിത്." },
          { type: "list-item", text: "സൈഡ്ബാറിലെ \"Body Release\" ക്ലിക്ക് ചെയ്യുക. നിലവിൽ കാബിനുകളിലുള്ള മൃതദേഹങ്ങൾ ഇവിടെ കാണാം." },
          { type: "list-item", text: "ആവശ്യമായ കേസ് കണ്ടെത്തി \"Release Body\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "തുറന്നുവരുന്ന വിൻഡോയിലെ വിവരങ്ങൾ പൂരിപ്പിക്കുക:" },
          { type: "sub-list-item", text: "Released To: മൃതദേഹം ഏറ്റുവാങ്ങുന്ന ആളുടെ പേര്." },
          { type: "sub-list-item", text: "Relation: മരിച്ചയാളുമായുള്ള ബന്ധം." },
          { type: "sub-list-item", text: "ID Proof: തിരിച്ചറിയൽ രേഖയുടെ വിവരങ്ങൾ (ഉദാഹരണത്തിന് വോട്ടർ ഐഡി അല്ലെങ്കിൽ മറ്റ് ഔദ്യോഗിക രേഖകളുടെ വിശദാംശങ്ങൾ)." },
          { type: "sub-list-item", text: "MLC കേസുകൾക്ക് മാത്രം: പോലീസ് വെരിഫിക്കേഷൻ ഭാഗത്തുള്ള Handed over by, ID badge എന്നീ വിവരങ്ങൾ നിർബന്ധമായും നൽകുക." },
          { type: "list-item", text: "\"Confirm Release\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "note", text: "ഫലം: മൃതദേഹത്തിന്റെ സ്റ്റാറ്റസ് Released എന്ന് മാറും. ഉപയോഗിച്ചിരുന്ന കാബിൻ പുതിയ അലോക്കേഷനുകൾക്കായി ലോക്ക് ചെയ്യപ്പെടുകയും മഞ്ഞ നിറത്തിലേക്ക് മാറി Needs Cleaning (വൃത്തിയാക്കേണ്ടതുണ്ട്) എന്ന് കാണിക്കുകയും ചെയ്യും." }
        ]
      },
      {
        id: "module-6",
        title: "മോഡ്യൂൾ 6: ഹൗസ് കീപ്പിംഗ് വിഭാഗം (ശുചീകരണ ജീവനക്കാർക്കും സൂപ്പർവൈസർമാർക്കും)",
        blocks: [
          { type: "paragraph", text: "ഒരു മൃതദേഹം വിട്ടുനൽകിയ ശേഷം, ആ കാബിൻ വീണ്ടും ഉപയോഗിക്കുന്നതിനായി 3 ഘട്ടങ്ങളുള്ള ശുചീകരണ പ്രക്രിയയിലൂടെ കടന്നുപോകേണ്ടതുണ്ട്." },
          { type: "heading", text: "1. ശുചീകരണം ആരംഭിക്കൽ (Housekeeping Staff)" },
          { type: "list-item", text: "ഹൗസ് കീപ്പിംഗ് അക്കൗണ്ട് ഉപയോഗിച്ച് സിസ്റ്റത്തിൽ ലോഗിൻ ചെയ്യുമ്പോൾ Housekeeping Dashboard കാണാം." },
          { type: "list-item", text: "ലിസ്റ്റിൽ മഞ്ഞ നിറത്തിൽ കിടക്കുന്ന \"Needs Cleaning\" കാബിനുകൾ പരിശോധിക്കുക." },
          { type: "list-item", text: "ശുചീകരണം ആരംഭിക്കുമ്പോൾ \"Start Cleaning\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. ഇതോടെ കാബിന്റെ നിറം ഓറഞ്ചായി മാറി Cleaning In Progress എന്ന് കാണിക്കും." },
          { type: "heading", text: "2. പൂർത്തിയായതായി രേഖപ്പെടുത്തൽ (Housekeeping Staff)" },
          { type: "list-item", text: "കാബിൻ പൂർണ്ണമായി വൃത്തിയാക്കി കഴിഞ്ഞാൽ വീണ്ടും ഡാഷ്ബോർഡിൽ വരിക." },
          { type: "list-item", text: "ആ കാബിന് നേരെയുള്ള \"Mark Complete\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. ഇപ്പോൾ കാബിന്റെ നിറം നീലയായി മാറി Pending Verification എന്ന് കാണിക്കും." },
          { type: "heading", text: "3. പരിശോധിച്ചു ഉറപ്പുവരുത്തൽ (Supervisor / M Staff)" },
          { type: "list-item", text: "ഒരു സൂപ്പർവൈസറോ അല്ലെങ്കിൽ M Staff-ൽ ഉള്ള ആളോ വൃത്തിയാക്കിയ കാബിൻ നേരിട്ട് കണ്ട് ബോധ്യപ്പെടേണ്ടതുണ്ട്." },
          { type: "list-item", text: "അതിനുശേഷം സിസ്റ്റത്തിൽ ലോഗിൻ ചെയ്ത് ഹൗസ് കീപ്പിംഗ് വ്യൂവിൽ വന്ന് \"Verify & Open\" ബട്ടൺ ക്ലിക്ക് ചെയ്യുക." },
          { type: "note", text: "ഇതോടെ കാബിൻ സ്റ്റാറ്റസ് ഉടൻ തന്നെ പച്ച നിറത്തിലേക്ക് മാറുകയും (Available), അടുത്ത പുതിയ മൃതദേഹം വെക്കാനായി തയ്യാറാവുകയും ചെയ്യും" }
        ]
      }
    ]
  }
};
