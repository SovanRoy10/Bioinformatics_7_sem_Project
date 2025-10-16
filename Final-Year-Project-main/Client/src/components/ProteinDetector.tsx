"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  Dna,
  Activity,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  Pill,
  FileText,
  Beaker,
  Atom,
  Microscope,
  MicroscopeIcon as Molecule,
  Thermometer,
  FlameIcon as Flare,
} from "lucide-react"
import proteins from "./../utils/Protiens.json"
import { toast } from "react-toastify"

// Define TypeScript interfaces
interface Protein {
  Protein: string
  uniprotId: string
}

interface ModelMetrics {
  metrics: {
    accuracy: number
    f1_score: number
    roc_auc: number
  }
  images?: {
    confusion_matrix?: string
    precision_recall_curve?: string
    roc_curve?: string
  }
}

interface PubChemSynonym {
  urn: {
    datatype: number
    label: string
    name?: string
    release: string
    software?: string
    source?: string
    version?: string
    implementation?: string
  }
  value: {
    sval?: string
    ival?: number
    fval?: number
    binary?: string
  }
}

interface PubChem {
  cid: number
  synonyms: PubChemSynonym[]
}

interface Drug {
  name: string
  drugId: string
  description: string
  clinical_trials: string[]
  pubmed_articles: string[]
  pubchem: PubChem
}

interface PositiveResult {
  predictions: string
  drugs: Drug[]
}

export default function ProteinDetector(): JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [selectedProtein, setSelectedProtein] = useState<string | null>(null)
  const [uniprotId, setUniprotId] = useState<string>("")
  const [result, setResult] = useState<string[] | string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [drugData, setDrugData] = useState<PositiveResult | null>(null)
  const [activeDrugIndex, setActiveDrugIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)

  // Refs for animation
  const accuracyCircleRef = useRef<SVGCircleElement | null>(null)
  const f1ScoreCircleRef = useRef<SVGCircleElement | null>(null)
  const rocAucCircleRef = useRef<SVGCircleElement | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!uniprotId) return
    const sequence = await fetchProteinSequence(uniprotId)
    setLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:5000/api/detect-protein", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence, uniprotId }),
      })
      const data = await response.json()

      // Check if the result is positive and contains drug data
      if (data.predictions === "POSITIVE" && data.drugs) {
        setDrugData(data)
      } else {
        setDrugData(null)
      }

      setResult(data.predictions)

      // Fetch metrics data
      const metricsResponse = await fetch("http://127.0.0.1:5000/api/model-metrics")
      const metricsData = await metricsResponse.json()
      setMetrics(metricsData)

      console.log("Model Metrics:", metricsData)
    } catch (error) {
      console.error("Error:", error)
      setResult("An error occurred while processing the protein.")
    }
    toast.dismiss()
    setLoading(false)
  }

  async function fetchProteinSequence(uniprotId: string): Promise<string | null> {
    const apiUrl = `https://rest.uniprot.org/uniprotkb/${uniprotId}.fasta`

    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const fastaContent = await response.text()
      const fastaLines = fastaContent.split("\n")
      const sequence = fastaLines.slice(1).join("").replace(/\s+/g, "")

      return sequence
    } catch (error) {
      console.error("Error fetching the protein sequence:", error)
      return null
    }
  }

  // Animate metrics circles when they become visible
  useEffect(() => {
    if (!metrics) return

    const animateCircle = (ref: React.RefObject<SVGCircleElement>, percentage: number): Animation | undefined => {
      if (!ref.current) return
      const circle = ref.current
      const radius = circle.r.baseVal.value
      const circumference = radius * 2 * Math.PI

      circle.style.strokeDasharray = `${circumference} ${circumference}`
      circle.style.strokeDashoffset = `${circumference}`

      // Animate the circle fill
      const offset = circumference - (percentage / 100) * circumference
      const animation = circle.animate([{ strokeDashoffset: `${circumference}` }, { strokeDashoffset: `${offset}` }], {
        duration: 1500,
        easing: "ease-out",
        fill: "forwards",
      })

      return animation
    }

    if (metrics && metrics.metrics) {
      animateCircle(accuracyCircleRef, metrics.metrics.accuracy * 100)
      animateCircle(f1ScoreCircleRef, metrics.metrics.f1_score * 100)
      animateCircle(rocAucCircleRef, metrics.metrics.roc_auc * 100)
    }
  }, [metrics])

  // Helper function to get specific PubChem property
  const getPubChemProperty = (drug: Drug, label: string, name?: string): string | number | null => {
    if (!drug.pubchem || !drug.pubchem.synonyms) return null

    const synonym = drug.pubchem.synonyms.find((s) => s.urn.label === label && (!name || s.urn.name === name))

    if (!synonym) return null

    if (synonym.value.sval) return synonym.value.sval
    if (synonym.value.fval !== undefined) return synonym.value.fval
    if (synonym.value.ival !== undefined) return synonym.value.ival

    return null
  }

  return (
    <div className="relative">
      {/* Enhanced background with DNA animation */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 to-indigo-900/80"></div>

        {/* DNA helix animation */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-[2px] bg-gradient-to-b from-teal-400 via-cyan-400 to-indigo-400"
              style={{
                left: `${10 + i * 8}%`,
                animation: `dnaFloat 15s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {Array.from({ length: 20 }).map((_, j) => (
                <div
                  key={j}
                  className="absolute w-8 h-[2px] bg-cyan-400/80"
                  style={{
                    top: `${j * 10}%`,
                    transform: `rotate(${i % 2 === 0 ? 45 : -45}deg)`,
                    left: i % 2 === 0 ? "-14px" : "-14px",
                  }}
                ></div>
              ))}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-900/50"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-indigo-400 rounded-full blur opacity-70"></div>
            <div className="relative bg-gradient-to-r from-teal-900 to-indigo-900 p-5 rounded-full">
              <Dna className="w-12 h-12 text-teal-300" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-12 max-w-md text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Protein Sequence Analysis</h2>
          <p className="text-teal-100/80">
            Select a protein from our database to analyze its sequence and determine cancer risk factors using our
            advanced deep learning model.
          </p>
        </motion.div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-2xl px-12 py-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-teal-900/30 flex items-center justify-between w-80 h-20"
          >
            <span className="truncate">{selectedProtein ? selectedProtein : "Select Protein"}</span>
            {isDropdownOpen ? <ChevronUp className="ml-2 h-6 w-6" /> : <ChevronDown className="ml-2 h-6 w-6" />}
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden z-50 border border-teal-200/30"
              >
                <div className="p-3 border-b border-teal-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search proteins..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {(proteins as Protein[])
                    .filter(
                      (protein) =>
                        protein.Protein.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        protein.uniprotId.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((protein) => (
                      <motion.button
                        key={protein.uniprotId}
                        onClick={() => {
                          setSelectedProtein(protein.Protein)
                          setIsDropdownOpen(false)
                          setUniprotId(protein.uniprotId)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-teal-50 last:border-0"
                        whileHover={{ scale: 1.01, x: 5, backgroundColor: "rgb(240 253 250)" }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className="font-medium text-gray-800">{protein.Protein}</span>
                        <span className="ml-2 text-sm text-teal-600">{protein.uniprotId}</span>
                      </motion.button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedProtein && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={loading}
              className="text-xl px-10 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-teal-900/30 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-5 w-5" />
                  Detect Protein
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Conditional Rendering for Results */}
      {result && (result[0] === "NEGATIVE" || result === "NEGATIVE") && metrics && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mt-8 mb-16 max-w-6xl mx-auto"
        >
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl shadow-2xl overflow-hidden border border-green-200/50">
            {/* Header Section */}
            <div className="relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="dna-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20 L40 20" stroke="currentColor" strokeWidth="1" className="text-green-500" />
                      <path d="M20 0 L20 40" stroke="currentColor" strokeWidth="1" className="text-green-500" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dna-pattern)" />
                </svg>
              </div>

              <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-teal-500/20 z-0"
              />
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="relative mb-6 md:mb-0 md:mr-10"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                    className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
                  />
                  <div className="bg-white p-5 rounded-full shadow-lg border border-green-200">
                    <CheckCircle className="w-20 h-20 text-green-500" />
                  </div>
                </motion.div>

                <div className="text-center md:text-left">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-green-600 mb-4"
                  >
                    Low Risk Detected
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-gray-700 max-w-2xl"
                  >
                    Based on the protein sequence analysis, there is a very low probability of cancer detection.
                    However, please consult with healthcare professionals for a comprehensive evaluation.
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Metrics Section */}
            <div className="p-8 md:p-12">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center"
              >
                <BarChart3 className="mr-2 h-6 w-6 text-teal-600" />
                Model Performance Metrics
              </motion.h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Accuracy Metric */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center border border-green-100"
                >
                  <div className="relative mx-auto w-40 h-40 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        ref={accuracyCircleRef}
                        className="text-green-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-3xl font-bold text-gray-800"
                      >
                        {metrics.metrics.accuracy ? (metrics.metrics.accuracy * 100).toFixed(1) : 0}%
                      </motion.span>
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800">Accuracy</h4>
                  <p className="text-gray-600 mt-2">Overall correctness of the model</p>
                </motion.div>

                {/* F1 Score Metric */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center border border-teal-100"
                >
                  <div className="relative mx-auto w-40 h-40 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        ref={f1ScoreCircleRef}
                        className="text-teal-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="text-3xl font-bold text-gray-800"
                      >
                        {metrics.metrics.f1_score ? (metrics.metrics.f1_score * 100).toFixed(1) : 0}%
                      </motion.span>
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800">F1 Score</h4>
                  <p className="text-gray-600 mt-2">Balance of precision and recall</p>
                </motion.div>

                {/* ROC AUC Metric */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center border border-cyan-100"
                >
                  <div className="relative mx-auto w-40 h-40 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        ref={rocAucCircleRef}
                        className="text-cyan-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="text-3xl font-bold text-gray-800"
                      >
                        {metrics.metrics.roc_auc ? (metrics.metrics.roc_auc * 100).toFixed(1) : 0}%
                      </motion.span>
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800">ROC AUC</h4>
                  <p className="text-gray-600 mt-2">Classification quality at various thresholds</p>
                </motion.div>
              </div>

              {/* Visualization Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-12"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
                  <Activity className="mr-2 h-6 w-6 text-teal-600" />
                  Model Visualizations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Confusion Matrix */}
                  <motion.div
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-green-100"
                  >
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Confusion Matrix</h4>
                    <div className="relative overflow-hidden rounded-lg">
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1.0, duration: 0.5 }}
                        className="w-full"
                      >
                        {metrics.images && metrics.images.confusion_matrix && (
                          <img
                            src={`data:image/png;base64,${metrics.images.confusion_matrix}`}
                            alt="Confusion Matrix"
                            className="w-full h-auto"
                          />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Precision-Recall Curve */}
                  <motion.div
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-teal-100"
                  >
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Precision-Recall Curve</h4>
                    <div className="relative overflow-hidden rounded-lg">
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="w-full"
                      >
                        {metrics.images && metrics.images.precision_recall_curve && (
                          <img
                            src={`data:image/png;base64,${metrics.images.precision_recall_curve}`}
                            alt="Precision-Recall Curve"
                            className="w-full h-auto"
                          />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* ROC Curve */}
                  <motion.div
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-cyan-100"
                  >
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">ROC Curve</h4>
                    <div className="relative overflow-hidden rounded-lg">
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="w-full"
                      >
                        {metrics.images && metrics.images.roc_curve && (
                          <img
                            src={`data:image/png;base64,${metrics.images.roc_curve}`}
                            alt="ROC Curve"
                            className="w-full h-auto"
                          />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Visualization Image - Repositioned and Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="mt-16 flex justify-center"
              >
                <div className="relative max-w-2xl w-full">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-green-300/30 to-teal-300/30 rounded-xl blur-xl"
                  />
                  <div className="relative z-10 bg-white p-4 rounded-xl shadow-lg border border-green-200 overflow-hidden">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Healthy Cell Visualization</h4>
                    <div className="relative pt-[56.25%]">
                      <img
                        src="https://scx2.b-cdn.net/gfx/news/2022/human-cell-atlas-maps.jpg"
                        alt="Healthy cells visualization"
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <p className="mt-4 text-gray-600 text-center">
                      Visual representation of healthy cellular structure with normal protein expression patterns.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* POSITIVE Result Section */}
      {result &&
        (result === "POSITIVE" || (Array.isArray(result) && result[0] === "POSITIVE")) &&
        drugData &&
        metrics && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 mt-8 mb-16 max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl shadow-2xl overflow-hidden border border-red-200/50">
              {/* Header Section */}
              <div className="relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="cell-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle
                          cx="20"
                          cy="20"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-red-500"
                        />
                        <circle cx="20" cy="20" r="3" fill="currentColor" className="text-red-500" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cell-pattern)" />
                  </svg>
                </div>

                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-500/20 z-0"
                />
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2,
                    }}
                    className="relative mb-6 md:mb-0 md:mr-10"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                      className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                    />
                    <div className="bg-white p-5 rounded-full shadow-lg border border-red-200">
                      <AlertTriangle className="w-20 h-20 text-red-500" />
                    </div>
                  </motion.div>

                  <div className="text-center md:text-left">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl md:text-5xl font-bold text-red-600 mb-4"
                    >
                      High Risk Detected
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg text-gray-700 max-w-2xl"
                    >
                      Based on the protein sequence analysis, there is a high probability of cancer-related activity.
                      Please consult with healthcare professionals immediately for a comprehensive evaluation.
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Metrics Section */}
              <div className="p-8 md:p-12">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center"
                >
                  <BarChart3 className="mr-2 h-6 w-6 text-red-600" />
                  Model Performance Metrics
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Accuracy Metric */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 text-center border border-red-100"
                  >
                    <div className="relative mx-auto w-40 h-40 mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          ref={accuracyCircleRef}
                          className="text-red-500"
                          strokeWidth="8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 }}
                          className="text-3xl font-bold text-gray-800"
                        >
                          {metrics.metrics.accuracy ? (metrics.metrics.accuracy * 100).toFixed(1) : 0}%
                        </motion.span>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">Accuracy</h4>
                    <p className="text-gray-600 mt-2">Overall correctness of the model</p>
                  </motion.div>

                  {/* F1 Score Metric */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 text-center border border-orange-100"
                  >
                    <div className="relative mx-auto w-40 h-40 mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          ref={f1ScoreCircleRef}
                          className="text-orange-500"
                          strokeWidth="8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.3 }}
                          className="text-3xl font-bold text-gray-800"
                        >
                          {metrics.metrics.f1_score ? (metrics.metrics.f1_score * 100).toFixed(1) : 0}%
                        </motion.span>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">F1 Score</h4>
                    <p className="text-gray-600 mt-2">Balance of precision and recall</p>
                  </motion.div>

                  {/* ROC AUC Metric */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-lg p-6 text-center border border-amber-100"
                  >
                    <div className="relative mx-auto w-40 h-40 mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          ref={rocAucCircleRef}
                          className="text-amber-500"
                          strokeWidth="8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.4 }}
                          className="text-3xl font-bold text-gray-800"
                        >
                          {metrics.metrics.roc_auc ? (metrics.metrics.roc_auc * 100).toFixed(1) : 0}%
                        </motion.span>
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">ROC AUC</h4>
                    <p className="text-gray-600 mt-2">Classification quality at various thresholds</p>
                  </motion.div>
                </div>

                {/* Visualization Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-12"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
                    <Activity className="mr-2 h-6 w-6 text-red-600" />
                    Model Visualizations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Confusion Matrix */}
                    <motion.div
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                      className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-red-100"
                    >
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Confusion Matrix</h4>
                      <div className="relative overflow-hidden rounded-lg">
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ delay: 1.0, duration: 0.5 }}
                          className="w-full"
                        >
                          {metrics.images && metrics.images.confusion_matrix && (
                            <img
                              src={`data:image/png;base64,${metrics.images.confusion_matrix}`}
                              alt="Confusion Matrix"
                              className="w-full h-auto"
                            />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Precision-Recall Curve */}
                    <motion.div
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                      className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-orange-100"
                    >
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Precision-Recall Curve</h4>
                      <div className="relative overflow-hidden rounded-lg">
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ delay: 1.1, duration: 0.5 }}
                          className="w-full"
                        >
                          {metrics.images && metrics.images.precision_recall_curve && (
                            <img
                              src={`data:image/png;base64,${metrics.images.precision_recall_curve}`}
                              alt="Precision-Recall Curve"
                              className="w-full h-auto"
                            />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* ROC Curve */}
                    <motion.div
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                      className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-amber-100"
                    >
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">ROC Curve</h4>
                      <div className="relative overflow-hidden rounded-lg">
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          transition={{ delay: 1.2, duration: 0.5 }}
                          className="w-full"
                        >
                          {metrics.images && metrics.images.roc_curve && (
                            <img
                              src={`data:image/png;base64,${metrics.images.roc_curve}`}
                              alt="ROC Curve"
                              className="w-full h-auto"
                            />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Drug Repurposing Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="mt-16"
                >
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-amber-400 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
                      <div className="p-6 md:p-8 bg-gradient-to-r from-red-50 to-amber-50">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                          <Pill className="mr-2 h-6 w-6 text-red-600" />
                          Potential Drug Repurposing Options
                        </h3>

                        {/* Drug Cards */}
                        <div className="grid grid-cols-1 gap-8">
                          {drugData.drugs.map((drug, index) => (
                            <motion.div
                              key={drug.drugId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.2 + index * 0.1 }}
                              className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
                                activeDrugIndex === index ? "border-red-300" : "border-gray-200"
                              }`}
                            >
                              {/* Drug Header */}
                              <div
                                className="p-6 cursor-pointer"
                                onClick={() => setActiveDrugIndex(activeDrugIndex === index ? null : index)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="relative mr-4">
                                      <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-amber-400 rounded-full blur opacity-30"></div>
                                      <div className="relative bg-white p-3 rounded-full shadow border border-red-100">
                                        <Pill className="h-8 w-8 text-red-500" />
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-xl font-bold text-gray-800">{drug.name}</h4>
                                      <p className="text-sm text-gray-500">ID: {drug.drugId}</p>
                                    </div>
                                  </div>
                                  <motion.div
                                    animate={{ rotate: activeDrugIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <ChevronDown className="h-6 w-6 text-gray-400" />
                                  </motion.div>
                                </div>
                                <p className="mt-3 text-gray-700">{drug.description}</p>
                              </div>

                              {/* Drug Details */}
                              <AnimatePresence>
                                {activeDrugIndex === index && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden border-t border-gray-100"
                                  >
                                    {/* Tabs */}
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                                      <div className="flex space-x-2 overflow-x-auto">
                                        <button
                                          onClick={() => setActiveTab("overview")}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === "overview"
                                              ? "bg-red-100 text-red-700"
                                              : "text-gray-600 hover:bg-gray-200"
                                          }`}
                                        >
                                          Overview
                                        </button>
                                        <button
                                          onClick={() => setActiveTab("chemical")}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === "chemical"
                                              ? "bg-red-100 text-red-700"
                                              : "text-gray-600 hover:bg-gray-200"
                                          }`}
                                        >
                                          Chemical Data
                                        </button>
                                        <button
                                          onClick={() => setActiveTab("research")}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === "research"
                                              ? "bg-red-100 text-red-700"
                                              : "text-gray-600 hover:bg-gray-200"
                                          }`}
                                        >
                                          Research
                                        </button>
                                      </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6">
                                      {/* Overview Tab */}
                                      {activeTab === "overview" && (
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="space-y-6"
                                        >
                                          <div className="flex flex-col md:flex-row gap-6">
                                            {/* Molecular Structure */}
                                            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                              <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <Molecule className="h-4 w-4 mr-2 text-red-500" />
                                                Molecular Structure
                                              </h5>
                                              <div className="aspect-square bg-white rounded-lg flex items-center justify-center p-4 border border-gray-100">
                                                <img
                                                  src={`https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${drug.pubchem.cid}&t=l`}
                                                  alt={`${drug.name} structure`}
                                                  className="max-w-full max-h-full object-contain"
                                                />
                                              </div>
                                              <p className="text-xs text-center mt-2 text-gray-500">
                                                PubChem CID: {drug.pubchem.cid}
                                              </p>
                                            </div>

                                            {/* Key Properties */}
                                            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                              <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <Beaker className="h-4 w-4 mr-2 text-red-500" />
                                                Key Properties
                                              </h5>
                                              <div className="space-y-3">
                                                {/* Molecular Formula */}
                                                <div
                                                  className="bg-white p-3 rounded-lg border border-gray-100 transition-colors hover:bg-red-50"
                                                  onMouseEnter={() => setHoveredProperty("formula")}
                                                  onMouseLeave={() => setHoveredProperty(null)}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Molecular Formula</span>
                                                    <motion.span
                                                      className="font-mono text-sm font-semibold text-red-600"
                                                      animate={{
                                                        scale: hoveredProperty === "formula" ? 1.05 : 1,
                                                        color: hoveredProperty === "formula" ? "#dc2626" : "#dc2626cc",
                                                      }}
                                                    >
                                                      {getPubChemProperty(drug, "Molecular Formula") as string}
                                                    </motion.span>
                                                  </div>
                                                </div>

                                                {/* Molecular Weight */}
                                                <div
                                                  className="bg-white p-3 rounded-lg border border-gray-100 transition-colors hover:bg-red-50"
                                                  onMouseEnter={() => setHoveredProperty("weight")}
                                                  onMouseLeave={() => setHoveredProperty(null)}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Molecular Weight</span>
                                                    <motion.span
                                                      className="font-mono text-sm font-semibold text-red-600"
                                                      animate={{
                                                        scale: hoveredProperty === "weight" ? 1.05 : 1,
                                                        color: hoveredProperty === "weight" ? "#dc2626" : "#dc2626cc",
                                                      }}
                                                    >
                                                      {getPubChemProperty(drug, "Molecular Weight") as string} g/mol
                                                    </motion.span>
                                                  </div>
                                                </div>

                                                {/* Log P */}
                                                <div
                                                  className="bg-white p-3 rounded-lg border border-gray-100 transition-colors hover:bg-red-50"
                                                  onMouseEnter={() => setHoveredProperty("logp")}
                                                  onMouseLeave={() => setHoveredProperty(null)}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Log P</span>
                                                    <motion.span
                                                      className="font-mono text-sm font-semibold text-red-600"
                                                      animate={{
                                                        scale: hoveredProperty === "logp" ? 1.05 : 1,
                                                        color: hoveredProperty === "logp" ? "#dc2626" : "#dc2626cc",
                                                      }}
                                                    >
                                                      {getPubChemProperty(drug, "Log P") ||
                                                        getPubChemProperty(drug, "Log P", "XLogP3") ||
                                                        getPubChemProperty(drug, "Log P", "XLogP3-AA")}
                                                    </motion.span>
                                                  </div>
                                                </div>

                                                {/* Hydrogen Bond Acceptors */}
                                                <div
                                                  className="bg-white p-3 rounded-lg border border-gray-100 transition-colors hover:bg-red-50"
                                                  onMouseEnter={() => setHoveredProperty("acceptors")}
                                                  onMouseLeave={() => setHoveredProperty(null)}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">H-Bond Acceptors</span>
                                                    <motion.span
                                                      className="font-mono text-sm font-semibold text-red-600"
                                                      animate={{
                                                        scale: hoveredProperty === "acceptors" ? 1.05 : 1,
                                                        color:
                                                          hoveredProperty === "acceptors" ? "#dc2626" : "#dc2626cc",
                                                      }}
                                                    >
                                                      {getPubChemProperty(drug, "Count", "Hydrogen Bond Acceptor")}
                                                    </motion.span>
                                                  </div>
                                                </div>

                                                {/* Hydrogen Bond Donors */}
                                                <div
                                                  className="bg-white p-3 rounded-lg border border-gray-100 transition-colors hover:bg-red-50"
                                                  onMouseEnter={() => setHoveredProperty("donors")}
                                                  onMouseLeave={() => setHoveredProperty(null)}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">H-Bond Donors</span>
                                                    <motion.span
                                                      className="font-mono text-sm font-semibold text-red-600"
                                                      animate={{
                                                        scale: hoveredProperty === "donors" ? 1.05 : 1,
                                                        color: hoveredProperty === "donors" ? "#dc2626" : "#dc2626cc",
                                                      }}
                                                    >
                                                      {getPubChemProperty(drug, "Count", "Hydrogen Bond Donor")}
                                                    </motion.span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* SMILES and InChI */}
                                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                              <Atom className="h-4 w-4 mr-2 text-red-500" />
                                              Chemical Identifiers
                                            </h5>
                                            <div className="space-y-3">
                                              {/* SMILES */}
                                              <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-start">
                                                  <span className="text-sm font-medium text-gray-600 min-w-24">
                                                    SMILES:
                                                  </span>
                                                  <motion.span
                                                    className="font-mono text-xs text-gray-800 break-all"
                                                    whileHover={{ color: "#dc2626" }}
                                                  >
                                                    {getPubChemProperty(drug, "SMILES", "Canonical") as string}
                                                  </motion.span>
                                                </div>
                                              </div>

                                              {/* InChI */}
                                              <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-start">
                                                  <span className="text-sm font-medium text-gray-600 min-w-24">
                                                    InChI:
                                                  </span>
                                                  <motion.span
                                                    className="font-mono text-xs text-gray-800 break-all"
                                                    whileHover={{ color: "#dc2626" }}
                                                  >
                                                    {getPubChemProperty(drug, "InChI", "Standard") as string}
                                                  </motion.span>
                                                </div>
                                              </div>

                                              {/* InChIKey */}
                                              <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-start">
                                                  <span className="text-sm font-medium text-gray-600 min-w-24">
                                                    InChIKey:
                                                  </span>
                                                  <motion.span
                                                    className="font-mono text-xs text-gray-800"
                                                    whileHover={{ color: "#dc2626" }}
                                                  >
                                                    {getPubChemProperty(drug, "InChIKey", "Standard") as string}
                                                  </motion.span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}

                                      {/* Chemical Data Tab */}
                                      {activeTab === "chemical" && (
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="space-y-6"
                                        >
                                          {/* Chemical Properties */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Physical Properties */}
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                              <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                                                Physical Properties
                                              </h5>
                                              <div className="space-y-2">
                                                {/* Complexity */}
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Complexity</span>
                                                    <motion.div
                                                      className="flex items-center"
                                                      whileHover={{ scale: 1.05 }}
                                                    >
                                                      <span className="font-mono text-sm font-semibold text-red-600">
                                                        {getPubChemProperty(drug, "Compound Complexity")}
                                                      </span>
                                                    </motion.div>
                                                  </div>
                                                </div>

                                                {/* Polar Surface Area */}
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Polar Surface Area</span>
                                                    <motion.div
                                                      className="flex items-center"
                                                      whileHover={{ scale: 1.05 }}
                                                    >
                                                      <span className="font-mono text-sm font-semibold text-red-600">
                                                        {getPubChemProperty(drug, "Topological", "Polar Surface Area")}{" "}
                                                        Å²
                                                      </span>
                                                    </motion.div>
                                                  </div>
                                                </div>

                                                {/* Rotatable Bonds */}
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Rotatable Bonds</span>
                                                    <motion.div
                                                      className="flex items-center"
                                                      whileHover={{ scale: 1.05 }}
                                                    >
                                                      <span className="font-mono text-sm font-semibold text-red-600">
                                                        {getPubChemProperty(drug, "Count", "Rotatable Bond")}
                                                      </span>
                                                    </motion.div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* IUPAC Names */}
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                              <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <FileText className="h-4 w-4 mr-2 text-red-500" />
                                                IUPAC Names
                                              </h5>
                                              <div className="space-y-2">
                                                {/* Preferred */}
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm text-gray-600 mb-1">Preferred</span>
                                                    <motion.span
                                                      className="font-mono text-xs text-gray-800 break-all"
                                                      whileHover={{ color: "#dc2626" }}
                                                    >
                                                      {getPubChemProperty(drug, "IUPAC Name", "Preferred") as string}
                                                    </motion.span>
                                                  </div>
                                                </div>

                                                {/* Traditional */}
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm text-gray-600 mb-1">Traditional</span>
                                                    <motion.span
                                                      className="font-mono text-xs text-gray-800 break-all"
                                                      whileHover={{ color: "#dc2626" }}
                                                    >
                                                      {getPubChemProperty(drug, "IUPAC Name", "Traditional") as string}
                                                    </motion.span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 3D Viewer */}
                                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                              <Flare className="h-4 w-4 mr-2 text-red-500" />
                                              3D Structure Viewer
                                            </h5>
                                            <div className="aspect-video bg-white rounded-lg flex items-center justify-center p-4 border border-gray-100">
                                              <iframe
                                                src={`https://pubchem.ncbi.nlm.nih.gov/compound/${drug.pubchem.cid}#section=3D-Conformer&embed=true`}
                                                className="w-full h-full rounded-lg"
                                                title={`${drug.name} 3D Structure`}
                                              ></iframe>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}

                                      {/* Research Tab */}
                                      {activeTab === "research" && (
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="space-y-6"
                                        >
                                          {/* PubMed Articles */}
                                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                              <FileText className="h-4 w-4 mr-2 text-red-500" />
                                              Recent PubMed Articles
                                            </h5>
                                            <div className="space-y-2">
                                              {drug.pubmed_articles.map((article, i) => (
                                                <motion.a
                                                  key={i}
                                                  href={article}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block bg-white p-3 rounded-lg border border-gray-100 hover:bg-red-50 transition-colors"
                                                  whileHover={{ x: 5, borderColor: "#f87171" }}
                                                >
                                                  <div className="flex items-center">
                                                    <ExternalLink className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700 truncate">{article}</span>
                                                  </div>
                                                </motion.a>
                                              ))}
                                              {drug.pubmed_articles.length === 0 && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                                  <span className="text-sm text-gray-500">
                                                    No PubMed articles available
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Clinical Trials */}
                                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                              <Microscope className="h-4 w-4 mr-2 text-red-500" />
                                              Clinical Trials
                                            </h5>
                                            <div className="space-y-2">
                                              {drug.clinical_trials.map((trial, i) => (
                                                <motion.a
                                                  key={i}
                                                  href={trial}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block bg-white p-3 rounded-lg border border-gray-100 hover:bg-red-50 transition-colors"
                                                  whileHover={{ x: 5, borderColor: "#f87171" }}
                                                >
                                                  <div className="flex items-center">
                                                    <ExternalLink className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700 truncate">{trial}</span>
                                                  </div>
                                                </motion.a>
                                              ))}
                                              {drug.clinical_trials.length === 0 && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                                  <span className="text-sm text-gray-500">
                                                    No clinical trials available
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* PubChem Link */}
                                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                              <Beaker className="h-4 w-4 mr-2 text-red-500" />
                                              Additional Resources
                                            </h5>
                                            <motion.a
                                              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${drug.pubchem.cid}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block bg-white p-4 rounded-lg border border-gray-100 hover:bg-red-50 transition-colors"
                                              whileHover={{ scale: 1.02, borderColor: "#f87171" }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                  <img
                                                    src="https://pubchem.ncbi.nlm.nih.gov/favicon.ico"
                                                    alt="PubChem"
                                                    className="w-5 h-5 mr-2"
                                                  />
                                                  <span className="text-sm font-medium text-gray-800">
                                                    View on PubChem
                                                  </span>
                                                </div>
                                                <ExternalLink className="h-4 w-4 text-red-500" />
                                              </div>
                                            </motion.a>
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Visualization Image - Cancer Cell */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="mt-16 flex justify-center"
                >
                  <div className="relative max-w-2xl w-full">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-red-300/30 to-amber-300/30 rounded-xl blur-xl"
                    />
                    <div className="relative z-10 bg-white p-4 rounded-xl shadow-lg border border-red-200 overflow-hidden">
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                        Cancer Cell Visualization
                      </h4>
                      <div className="relative pt-[56.25%]">
                        <img
                          src="https://www.tugraz.at/fileadmin/user_upload/tugrazInternal/News_Stories/Medienservice/2021/Krebszellenmodell/Cancer-cell-by-peterschreiber-media-AdobeStock-EL-banner.jpg"
                          alt="Cancer cells visualization"
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <p className="mt-4 text-gray-600 text-center">
                        Visual representation of cancer cells with abnormal protein expression patterns.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
    </div>
  )
}
