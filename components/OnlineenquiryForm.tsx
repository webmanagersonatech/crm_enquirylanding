import { FormEvent, useState, useEffect } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { toast } from "sonner";
import { getStudentSettings, getActiveInstitutions, createOnlineLead } from "@/lib/api";

type Props = { instituteId?: string | null };

type FormErrors = {
    candidateName?: string;
    email?: string;
    phoneNumber?: string;
    community?: string;
    programId?: string;
    dateOfBirth?: string;
    country?: string;
    state?: string;
    city?: string;
    captcha?: string;
};

export default function OnlineEnquiryForm({ instituteId }: Props) {
    const [loading, setLoading] = useState(false);
    const [institutdata, setInstitutdata] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    // CAPTCHA states
    const [captchaText, setCaptchaText] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaError, setCaptchaError] = useState("");

    // Generate random CAPTCHA (mix of letters and numbers)
    const generateCaptcha = () => {
        const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const numbers = "23456789";

        let result = "";

        // Generate 6 character CAPTCHA (alternating letters and numbers)
        for (let i = 0; i < 6; i++) {
            if (i % 2 === 0) {
                // Add a random letter
                result += letters[Math.floor(Math.random() * letters.length)];
            } else {
                // Add a random number
                result += numbers[Math.floor(Math.random() * numbers.length)];
            }
        }

        setCaptchaText(result);
        setCaptchaInput("");
        setCaptchaError("");
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const validateCaptcha = (): boolean => {
        if (captchaInput.toUpperCase() !== captchaText) {
            setCaptchaError("Incorrect CAPTCHA. Please try again.");
            return false;
        }
        setCaptchaError("");
        return true;
    };

    const [form, setForm] = useState({
        candidateName: "",
        email: "",
        phoneNumber: "",
        community: "",
        programId: "",
        country: "",
        state: "",
        city: "",
        status: "New",
        communication: "Online",
        followUpDate: new Date().toISOString().split("T")[0],
        description: "This lead enquiry has come from online",
    });

    useEffect(() => {
        const fetchCountry = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();

                if (data?.country_name) {
                    setForm(prev => ({
                        ...prev,
                        country: data.country_name
                    }));
                }
            } catch (err) {
                console.log("Country auto-detect failed");
            }
        };

        fetchCountry();
    }, []);

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
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Validation function for individual fields
    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case "candidateName":
                if (!value.trim()) return "Candidate Name is required";
                if (value.trim().length < 2) return "Name must be at least 2 characters";
                if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces";
                return undefined;

            case "email":
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return "Please enter a valid email address";
                }
                return undefined;

            case "phoneNumber":
                if (!value) return "Phone Number is required";
                if (value.length < 10) return "Phone Number must be 10 digits";
                if (!/^\d{10}$/.test(value)) return "Please enter a valid 10-digit phone number";
                // Check if first digit is 6,7,8, or 9
                if (!/^[6-9]/.test(value)) return "Phone number must start with 6, 7, 8, or 9";
                return undefined;

            case "programId":
                if (!value) return "Please select a Program";
                return undefined;

            case "country":
                if (!value) return "Please select a Country";
                return undefined;

            case "community":
                if (instituteId === "INS-ZFBTTF5P" && !value) {
                    return "Please select Community";
                }
                return undefined;

            case "state":
                if (!value) return "Please select a State";
                return undefined;

            case "city":
                if (!value) return "Please select a City";
                return undefined;

            default:
                return undefined;
        }
    };

    // Validate entire form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        Object.keys(form).forEach(key => {
            if (key in newErrors) return;
            const error = validateField(key, form[key as keyof typeof form] as string);
            if (error) {
                newErrors[key as keyof FormErrors] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle field change with validation
    const handleFieldChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));

        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate the changed field
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };
    const COMMUNITY_OPTIONS = [
        { label: "OC", value: "OC" },
        { label: "BC", value: "BC" },
        { label: "BCM", value: "BCM" },
        { label: "MBC / DNC", value: "MBC_DNC" },
        { label: "SC", value: "SC" },
        { label: "SCA", value: "SCA" },
        { label: "ST", value: "ST" },
    ];
    // Handle blur to mark field as touched
    const handleFieldBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate on blur
        const error = validateField(field, form[field as keyof typeof form] as string);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validate CAPTCHA first (frontend only)
        if (!validateCaptcha()) {
            toast.error("Please enter the correct CAPTCHA");
            generateCaptcha(); // Generate new CAPTCHA on failure
            return;
        }

        // Mark all fields as touched on submit
        const allTouched = Object.keys(form).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as { [key: string]: boolean });
        setTouched(allTouched);

        // Validate all fields
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                instituteId: instituteId!,
                programId: form.programId,
                candidateName: form.candidateName,
                phoneNumber: form.phoneNumber || "",

                email: form.email || "",
                country: form.country || "",
                state: form.state || "",
                city: form.city || "",
                status: form.status || "New",
                communication: form.communication || "Online",
                followUpDate: form.followUpDate || new Date().toISOString().split("T")[0],
                description: form.description || "This lead enquiry has come from online",
                leadSource: "online",
                ...(instituteId === "INS-ZFBTTF5P" && {
                    community: form.community || ""
                })
            };

            const res = await createOnlineLead(payload);

            toast.success(res.message || "Enquiry submitted successfully.");

            setSubmitted(true);
            setForm({
                candidateName: "",
                email: "",
                phoneNumber: "",
                programId: "",
                community: "",
                country: "",
                state: "",
                city: "",
                status: "New",
                communication: "Online",
                followUpDate: new Date().toISOString().split("T")[0],
                description: "This lead enquiry has come from online",
            });
            setErrors({});
            setTouched({});
            setFormKey(prev => prev + 1);

            // Generate new CAPTCHA after successful submission
            generateCaptcha();

            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => setSubmitted(false), 3000);

        } catch (err: any) {
            const status = err.response?.status;
            const message = err.response?.data?.message || "Unable to submit enquiry";

            if (status === 409) {
                toast.error(message);
                return;
            }

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    const showError = (fieldName: string): boolean => {
        return !!(touched[fieldName] && errors[fieldName as keyof FormErrors]);
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
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        <form onSubmit={handleSubmit} key={formKey} className="space-y-4 bg-white p-6 rounded-2xl shadow-md">

                            {/* Candidate Name Field */}
                            <div>
                                <input
                                    placeholder="Candidate Full Name"
                                    value={form.candidateName}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                                        handleFieldChange("candidateName", value);
                                    }}
                                    onBlur={() => handleFieldBlur("candidateName")}
                                    className={`w-full px-4 py-3 border ${showError("candidateName") ? "border-red-500" : "border-gray-300"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition`}
                                />
                                {showError("candidateName") && (
                                    <p className="mt-1 text-sm text-red-500">{errors.candidateName}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div>
                                <input
                                    placeholder="Email Address (optional)"
                                    type="email"
                                    className={`w-full px-4 py-3 border ${showError("email") ? "border-red-500" : "border-gray-300"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition`}
                                    value={form.email}
                                    onChange={(e) => handleFieldChange("email", e.target.value)}
                                    onBlur={() => handleFieldBlur("email")}
                                />
                                {showError("email") && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone Number Field */}
                            <div>
                                <input
                                    placeholder="Phone Number"
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        handleFieldChange("phoneNumber", value);
                                    }}
                                    onBlur={() => handleFieldBlur("phoneNumber")}
                                    className={`w-full px-4 py-3 border ${showError("phoneNumber") ? "border-red-500" : "border-gray-300"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition`}
                                />
                                {showError("phoneNumber") && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                                )}
                            </div>

                            {instituteId === "INS-ZFBTTF5P" && (
                                <div>
                                    <Select
                                        styles={selectRoyalStyles(showError("community"))}
                                        placeholder="Select Community"
                                        value={
                                            form.community
                                                ? COMMUNITY_OPTIONS.find(c => c.value === form.community)
                                                : null
                                        }
                                        options={COMMUNITY_OPTIONS}
                                        onChange={(opt: any) => {
                                            handleFieldChange("community", opt?.value || "");
                                        }}
                                        onBlur={() => handleFieldBlur("community")}
                                    />

                                    {showError("community") && (
                                        <p className="mt-1 text-sm text-red-500">{errors.community}</p>
                                    )}
                                </div>
                            )}

                            {/* Program Field */}
                            <div>
                                <Select
                                    styles={selectRoyalStyles(showError("programId"))}
                                    placeholder="Select Program"

                                    value={
                                        form.programId
                                            ? {
                                                label:
                                                    institutdata?.courses?.find(
                                                        (c: any) => c.courseId === form.programId
                                                    )?.name?.toUpperCase() || "",
                                                value: form.programId,
                                            }
                                            : null
                                    }

                                    options={institutdata?.courses?.map((c: any) => ({
                                        label: c.name.toUpperCase(),   // ✅ show course name
                                        value: c.courseId,             // ✅ send only courseId
                                    }))}

                                    onChange={(opt: any) => {
                                        handleFieldChange("programId", opt?.value || "");
                                    }}

                                    onBlur={() => handleFieldBlur("programId")}
                                />

                                {showError("programId") && (
                                    <p className="mt-1 text-sm text-red-500">{errors.programId}</p>
                                )}
                            </div>



                            {/* Country / State / City */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Country */}
                                <div>
                                    <Select
                                        styles={selectRoyalStyles(showError("country"))}
                                        placeholder="Country"
                                        value={form.country ? { label: form.country, value: form.country } : null}
                                        options={Country.getAllCountries().map(c => ({
                                            label: c.name,
                                            value: c.name,
                                        }))}
                                        onChange={(opt: any) => {
                                            handleFieldChange("country", opt?.value || "");
                                            handleFieldChange("state", "");
                                            handleFieldChange("city", "");
                                        }}
                                        onBlur={() => handleFieldBlur("country")}
                                    />
                                    {showError("country") && (
                                        <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                                    )}
                                </div>

                                {/* State */}
                                <div>
                                    <Select
                                        styles={selectRoyalStyles(showError("state"))}
                                        placeholder="State"
                                        isDisabled={!form.country}
                                        value={form.state ? { label: form.state, value: form.state } : null}
                                        options={State.getStatesOfCountry(
                                            Country.getAllCountries().find(c => c.name === form.country)?.isoCode || ""
                                        ).map(s => ({ label: s.name, value: s.name }))}
                                        onChange={(opt: any) => {
                                            handleFieldChange("state", opt?.value || "");
                                            handleFieldChange("city", "");
                                        }}
                                        onBlur={() => handleFieldBlur("state")}
                                    />
                                    {showError("state") && (
                                        <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                                    )}
                                </div>

                                {/* City */}
                                <div>
                                    <Select
                                        styles={selectRoyalStyles(showError("city"))}
                                        placeholder="City"
                                        isDisabled={!form.state}
                                        value={form.city ? { label: form.city, value: form.city } : null}
                                        options={City.getCitiesOfState(
                                            Country.getAllCountries().find(c => c.name === form.country)?.isoCode || "",
                                            State.getStatesOfCountry(
                                                Country.getAllCountries().find(c => c.name === form.country)?.isoCode || ""
                                            ).find(s => s.name === form.state)?.isoCode || ""
                                        ).map(c => ({ label: c.name, value: c.name }))}
                                        onChange={(opt: any) => handleFieldChange("city", opt?.value || "")}
                                        onBlur={() => handleFieldBlur("city")}
                                    />
                                    {showError("city") && (
                                        <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                                    )}
                                </div>
                            </div>

                            {/* CAPTCHA Field - Character & Number Type with Image Style */}
                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification <span className="text-red-500">*</span>
                                </label>

                                {/* CAPTCHA Image Simulation */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-gradient-to-r from-[#0b1c3d] to-[#1a2b4d] p-4 rounded-xl shadow-lg min-w-[180px]">
                                        <div className="flex items-center justify-center gap-1 text-3xl font-mono font-bold tracking-wider text-white">
                                            {captchaText.split('').map((char, index) => (
                                                <span
                                                    key={index}
                                                    className={`
                                                        ${index % 2 === 0
                                                            ? 'text-yellow-400'  // Letters in yellow
                                                            : 'text-white'       // Numbers in white
                                                        } 
                                                        ${Math.random() > 0.5 ? 'rotate-3' : '-rotate-3'} 
                                                        inline-block transform
                                                    `}
                                                >
                                                    {char}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-center mt-2 text-xs text-gray-300 bg-black/20 py-1 rounded">
                                            Enter the code above
                                        </div>
                                    </div>

                                    {/* Refresh Button */}
                                    <button
                                        type="button"
                                        onClick={generateCaptcha}
                                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition"
                                        title="New CAPTCHA"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>

                                {/* CAPTCHA Input */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter characters & numbers (case insensitive)"
                                        value={captchaInput}
                                        onChange={(e) => {
                                            // Allow alphanumeric only
                                            const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                            setCaptchaInput(value);
                                            if (captchaError) setCaptchaError("");
                                        }}
                                        className={`w-full px-4 py-2 border ${captchaError ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b1c3d] focus:border-transparent transition`}
                                        maxLength={6}
                                    />
                                </div>

                                {/* CAPTCHA Error Message */}
                                {captchaError && (
                                    <p className="mt-1 text-sm text-red-500">{captchaError}</p>
                                )}

                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Enter the 6-character code shown above (letters and numbers)
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || submitted}
                                className="w-full bg-[#0b1c3d] disabled:opacity-60 text-white py-3 rounded-xl hover:bg-[#0b1c3d]/90 transition"
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
const selectRoyalStyles = (hasError?: boolean) => ({
    control: (base: any) => ({
        ...base,
        borderRadius: "12px",
        minHeight: "46px",
        borderColor: hasError ? "#ef4444" : "#cbd5e1",
        boxShadow: "none",
        ":hover": { borderColor: hasError ? "#ef4444" : "#0b1c3d" },
    }),
});