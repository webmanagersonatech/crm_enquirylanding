
import { FormEvent, useState, useEffect } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { toast } from "sonner";
import { getStudentSettings, getActiveInstitutions, createOnlineLead } from "@/lib/api";

type Props = { instituteId?: string | null };

export default function OnlineEnquiryForm({ instituteId }: Props) {
    const [loading, setLoading] = useState(false);
    const [institutdata, setInstitutdata] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [formKey, setFormKey] = useState(0);


    const [form, setForm] = useState({
        candidateName: "",
        email: "",
        phoneNumber: "",
        program: "",
        dateOfBirth: "", // will convert to date string before sending
        country: "",
        state: "",
        city: "",
        status: "New",
        communication: "Online",
        followUpDate: new Date().toISOString().split("T")[0],
        description: "This lead enquiry has come from online",
    });


    useEffect(() => {
        const init = async () => {
            if (instituteId) {
                const res = await getStudentSettings(instituteId);
                if (res.success) setInstitutdata(res.data);
                return;
            }
            const res = await getActiveInstitutions();
            if (res.success) setInstitutions(res.data);
        };
        init();
    }, [instituteId]);

    const MIN_AGE = institutdata?.applicantage || 18;

    const getAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    const validateForm = () => {
        if (!form.candidateName.trim()) {
            toast.error("Candidate Name is required");
            return false;
        }

        if (!form.phoneNumber.trim()) {
            toast.error("Phone Number is required");
            return false;
        }

        if (form.phoneNumber.length < 10) {
            toast.error("Enter a valid Phone Number");
            return false;
        }

        if (!form.program) {
            toast.error("Please select a Program");
            return false;
        }

        if (!form.dateOfBirth) {
            toast.error("Date of Birth is required");
            return false;
        }

        const age = getAge(form.dateOfBirth);
        if (age < MIN_AGE) {
            toast.error(`Minimum age required is ${MIN_AGE} years`);
            return false;
        }

        if (!form.country) {
            toast.error("Please select a Country");
            return false;
        }

        if (!form.state) {
            toast.error("Please select a State");
            return false;
        }

        if (!form.city) {
            toast.error("Please select a City");
            return false;
        }

        return true;
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                instituteId: instituteId!,
                program: form.program,
                candidateName: form.candidateName,
                phoneNumber: form.phoneNumber || "",
                email: form.email || "",
                dateOfBirth: form.dateOfBirth || "",
                country: form.country || "",
                state: form.state || "",
                city: form.city || "",
                status: form.status || "New",
                communication: form.communication || "Online",
                followUpDate: form.followUpDate || new Date().toISOString().split("T")[0],
                description: form.description || "This lead enquiry has come from online",
                leadSource: "online",
            };

            const res = await createOnlineLead(payload);

            // Only 201 reaches here
            toast.success(res.message || "Enquiry submitted successfully.");

            setSubmitted(true);
            setForm({
                candidateName: "",
                email: "",
                phoneNumber: "",
                program: "",
                dateOfBirth: "",
                country: "",
                state: "",
                city: "",
                status: "New",
                communication: "Online",
                followUpDate: new Date().toISOString().split("T")[0],
                description: "This lead enquiry has come from online",
            });
            setFormKey(prev => prev + 1);

            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => setSubmitted(false), 3000);

        } catch (err: any) {
            const status = err.response?.status;
            const message = err.response?.data?.message || "Unable to submit enquiry";

            // 🟡 Duplicate (409)
            if (status === 409) {
                toast.error(message);
                return;
            }

            // 🔴 Validation / server errors
            toast.error(message);

        } finally {
            setLoading(false);
        }
    };






    return (
        <section className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">

                {/* ---------------- LEFT SIDE ---------------- */}
                <div
                    className="hidden lg:flex flex-col justify-center px-20 relative text-white"
                    style={{
                        backgroundImage:
                            "url('https://img.freepik.com/free-photo/graduation-high-school-university-concept_185193-109736.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="absolute inset-0 bg-[#0b1c3d]/60"></div>

                    <div className="relative z-10 max-w-lg">
                        <span className="uppercase tracking-widest text-sm text-yellow-400 mb-4 block">
                            Admission Enquiry
                        </span>

                        <h1 className="text-4xl font-semibold leading-snug mb-6">
                            Education Information <br /> For Aspiring Students
                        </h1>

                        <p className="text-white/90 text-lg mb-10">
                            This form connects students with educational institutions to get accurate program, admission, and learning info.
                        </p>

                        <div className="space-y-4 text-lg">
                            <Feature text="Details about academic programs" />
                            <Feature text="Admission & eligibility guidance" />
                            <Feature text="Support from academic counsellors" />
                            <Feature text="Flexible study & learning options" />
                        </div>

                        <div className="mt-14 flex gap-12">
                            <Stat value="Trusted" label="Institutions" />
                            <Stat value="Verified" label="Information" />
                            <Stat value="Dedicated" label="Support" />
                        </div>
                    </div>
                </div>

                {/* ---------------- RIGHT SIDE FORM ---------------- */}
                <div className="flex items-center justify-center bg-white px-8 py-12">
                    <div className="w-full max-w-xl flex flex-col justify-center">

                        {/* ---------- LOGO + NAME ---------- */}
                        {institutdata ? (
                            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-200">
                                <div className="flex-shrink-0">
                                    <img
                                        src={institutdata.logo}
                                        alt={`${institutdata.instituteName} Logo`}
                                        className="h-14 w-14 object-contain"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-lg font-semibold text-[#0b1c3d]">
                                        {institutdata.instituteName}
                                    </h1>
                                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                        Official Admission Enquiry Portal
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-20 mb-6 bg-gray-100 animate-pulse rounded"></div>
                        )}

                        {/* ---------- FORM TITLE ---------- */}
                        <h2 className="text-2xl font-semibold text-[#0b1c3d] mb-6">
                            Admission Enquiry
                            <p className="text-gray-500 font-normal text-sm mt-1">
                                Share your details and our counsellor will reach out to you
                            </p>
                        </h2>

                        {/* ---------- FORM ---------- */}
                        <form onSubmit={handleSubmit} key={formKey} className="space-y-5 bg-white p-6 rounded-2xl shadow-md">

                            <input
                                placeholder="Candidate Full Name"
                                value={form.candidateName}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                                    setForm({ ...form, candidateName: value });
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                            />

                            <input
                                placeholder="Email Address (optional)"
                                type="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <input
                                placeholder="Phone Number"
                                type="tel"
                                value={form.phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setForm({ ...form, phoneNumber: value });
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                            />


                            {/* Program */}
                            <Select
                                styles={selectRoyalStyles}
                                placeholder="Select Program"
                                value={
                                    form.program
                                        ? { label: form.program.toUpperCase(), value: form.program }
                                        : null
                                }
                                options={institutdata?.courses?.map((c: string) => ({
                                    label: c.toUpperCase(),
                                    value: c,
                                }))}
                                onChange={(opt: any) =>
                                    setForm({ ...form, program: opt?.value || "" })
                                }
                            />


                            {/* DOB */}
                            <input
                                placeholder="Date of Birth"
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition"
                                value={form.dateOfBirth}
                                onFocus={(e) => (e.target.type = "date")}
                                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                            />

                            {/* Country / State / City */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                <Select
                                    styles={selectRoyalStyles}
                                    placeholder="Country"
                                    value={form.country ? { label: form.country, value: form.country } : null}
                                    options={Country.getAllCountries().map(c => ({
                                        label: c.name,
                                        value: c.name,
                                    }))}
                                    onChange={(opt: any) =>
                                        setForm({ ...form, country: opt?.value || "", state: "", city: "" })
                                    }
                                />


                                <Select
                                    styles={selectRoyalStyles}
                                    placeholder="State"
                                    isDisabled={!form.country}
                                    value={form.state ? { label: form.state, value: form.state } : null}
                                    options={State.getStatesOfCountry(
                                        Country.getAllCountries().find(c => c.name === form.country)?.isoCode || ""
                                    ).map(s => ({ label: s.name, value: s.name }))}
                                    onChange={(opt: any) =>
                                        setForm({ ...form, state: opt?.value || "", city: "" })
                                    }
                                />



                                <Select
                                    styles={selectRoyalStyles}
                                    placeholder="City"
                                    isDisabled={!form.state}
                                    value={form.city ? { label: form.city, value: form.city } : null}
                                    options={City.getCitiesOfState(
                                        Country.getAllCountries().find(c => c.name === form.country)?.isoCode || "",
                                        State.getStatesOfCountry(
                                            Country.getAllCountries().find(c => c.name === form.country)?.isoCode || ""
                                        ).find(s => s.name === form.state)?.isoCode || ""
                                    ).map(c => ({ label: c.name, value: c.name }))}
                                    onChange={(opt: any) =>
                                        setForm({ ...form, city: opt?.value || "" })
                                    }
                                />


                            </div>


                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || submitted}
                                className="w-full bg-[#0b1c3d] disabled:opacity-60 text-white py-3 rounded-xl"
                            >
                                {loading ? "Submitting..." : submitted ? "Submitted ✓" : "Submit Enquiry"}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </section>

    );
}

/* ---------------- SMALL COMPONENTS ---------------- */
function Feature({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-yellow-400">◆</span>
            {text}
        </div>
    );
}
function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <p className="text-3xl font-semibold text-yellow-400">{value}</p>
            <p className="text-sm text-white">{label}</p>
        </div>
    );
}

/* ---------------- SELECT STYLES ---------------- */
const selectRoyalStyles = {
    control: (base: any) => ({
        ...base,
        borderRadius: "12px",
        minHeight: "46px",
        borderColor: "#cbd5e1",
        boxShadow: "none",
        ":hover": { borderColor: "#0b1c3d" },
    }),
};
