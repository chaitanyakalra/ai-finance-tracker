import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

function Budgets() {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Budgets & Goals</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-muted">
                                <div className="absolute h-full w-full rounded-full border-8 border-primary border-t-transparent" style={{ transform: 'rotate(-45deg)' }}></div>
                                <div className="text-center">
                                    <span className="text-2xl font-bold">75%</span>
                                    <p className="text-xs text-muted-foreground">Used</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">$2,250 / $3,000</p>
                                <p className="text-xs text-muted-foreground">Left: $750</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Category Budgets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Food & Dining</span>
                                <span>$450 / $600</span>
                            </div>
                            <Progress value={75} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Transportation</span>
                                <span>$120 / $200</span>
                            </div>
                            <Progress value={60} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Entertainment</span>
                                <span>$280 / $300</span>
                            </div>
                            <Progress value={93} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Savings Goals</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Car</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>$15,000 / $25,000</span>
                            </div>
                            <Progress value={60} className="h-3" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adjust Monthly Contribution</label>
                                <Slider defaultValue={[500]} max={2000} step={50} />
                                <p className="text-xs text-muted-foreground text-right">$500/mo</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Emergency Fund</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>$8,000 / $10,000</span>
                            </div>
                            <Progress value={80} className="h-3" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adjust Monthly Contribution</label>
                                <Slider defaultValue={[200]} max={1000} step={50} />
                                <p className="text-xs text-muted-foreground text-right">$200/mo</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Budgets;
