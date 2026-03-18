import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

interface CleaningSummary {
  original_rows?: number;
  duplicates_removed?: number;
  missing_values_handled?: number;
  rows_after_cleaning?: number;
  columns?: number;
  [key: string]: any;
}

interface ApiResponse {
  message: string;
  summary: CleaningSummary;
  preview: any[];
  tableau_url: string;
  original_filename?: string; // ✅ newly used
  cleaned_filename?: string; // ✅ optional, if backend includes it
}

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<CleaningSummary | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [tableauUrl, setTableauUrl] = useState<string>("");
  const [originalFilename, setOriginalFilename] = useState<string>(""); // ✅ store the original filename

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (["csv", "xlsx", "json"].includes(fileType || "")) {
        setFile(selectedFile);
        setSummary(null);
        setPreview([]);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV, XLSX, or JSON file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:5000/clean_data", {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data: ApiResponse = await response.json();

      // ✅ Store details
      setSummary(data.summary);
      setPreview(data.preview);
      setTableauUrl(data.tableau_url);

      // ✅ Capture correct filename safely
      const resolvedFilename =
        data.original_filename?.trim() ||
        data.cleaned_filename?.replace(/^cleaned_/, "").trim() ||
        file.name;

      setOriginalFilename(resolvedFilename);

      console.log("📂 Final filename stored:", resolvedFilename);

      toast({
        title: "Success!",
        description: data.message || "Dataset cleaned successfully.",
      });

      // ✅ Navigate after small delay with consistent filename
      setTimeout(() => {
        navigate("/dashboard", {
          state: {
            tableauUrl: data.tableau_url,
            preview: data.preview,
            filename: resolvedFilename, // ✅ always passes plain filename
            summary: data.summary, // ✅ Pass summary to dashboard
          },
        });
      }, 1200);
    } catch (error) {
      console.error("❌ Upload error:", error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Cannot connect to Flask server. Make sure it's running on http://127.0.0.1:5000 and CORS is enabled.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Dataset</h1>
            <p className="text-muted-foreground">
              Upload your data file and let AI clean it automatically
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="mb-6 animate-scale-in">
          <CardHeader>
            <CardTitle>Select File</CardTitle>
            <CardDescription>Supported formats: CSV, XLSX, JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Input */}
              <div className="flex items-center gap-4">
                <label
                  htmlFor="file-upload"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50"
                >
                  <FileSpreadsheet className="mb-2 h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to select a file"}
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || isLoading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-dark"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Clean & Analyze Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cleaning Summary */}
        {summary && (
          <Card className="mb-6 animate-fade-in border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle>Cleaning Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryItem label="Original Rows" value={summary.original_rows || 0} />
                <SummaryItem label="Duplicates Removed" value={summary.duplicates_removed || 0} />
                <SummaryItem label="Missing Values" value={summary.missing_values_handled || 0} />
                <SummaryItem label="Rows After Cleaning" value={summary.rows_after_cleaning || 0} />
                <SummaryItem label="Columns" value={summary.columns || 0} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        {preview.length > 0 && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>First 10 rows of your cleaned dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left font-semibold text-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border transition-colors hover:bg-muted/30"
                      >
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-3 text-muted-foreground">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
};

export default UploadPage;
